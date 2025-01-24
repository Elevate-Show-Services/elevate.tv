import fs from 'fs';
import path from 'path';
import ffmpeg from 'fluent-ffmpeg';
import { attemptAsync } from 'ts-utils/check';
import { EventEmitter } from 'ts-utils/event-emitter';

type StreamProtocol = Partial<{
    primary: string;
}>;

export class Manager {

    private readonly emitter = new EventEmitter<{
        error: Error;
        streamEvent: { event: string, data: unknown };
    }>();

    public readonly on = this.emitter.on.bind(this.emitter);
    public readonly off = this.emitter.off.bind(this.emitter);
    public readonly once = this.emitter.once.bind(this.emitter);
    private readonly emit = this.emitter.emit.bind(this.emitter);

    public streams: string[] = [];
    public protocol: StreamProtocol = {};

    constructor(
        public readonly inputDir: string,
        public readonly outputDir: string,
        public readonly name: string,
    ) {}

    public init() {
        return attemptAsync(async () => {
            (await this.scanDir()).unwrap();
            await fs.promises.mkdir(this.outputDir, { recursive: true });
        });
    }


    private scanDir() {
        return attemptAsync(async () => {
            const files = await fs.promises.readdir(this.inputDir);
            this.streams = files
                .filter(f => f.endsWith('.m3u8'))
                .map(f => path.join(this.inputDir, f));
            return this.streams;
        });
    }

    combineStreams() {
        return attemptAsync(async () => {
            const ffmpegCommand = ffmpeg();
            const outputPath = path.join(this.outputDir, `${this.name}.m3u8`);

            for (let i = 0; i < this.streams.length; i++) {
                ffmpegCommand.input(this.streams[i]);
            }

            ffmpegCommand
                .output(outputPath)
                .on('end', () => {
                    console.log('Merging finished');
                })
                .on('error', (err) => {
                    console.error('Error:', err);
                })
                .run();
        });
    }

    setCombineProtocol(protocol: StreamProtocol) {
        this.protocol = protocol;
    }

    event(event: string, data: unknown) {
        this.emit('streamEvent', { event, data });
    }
}
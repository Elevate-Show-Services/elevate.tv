import { Mailer } from '$lib/server/structs/mailer.js';
import terminal from '$lib/server/utils/terminal.js';
import { fail } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import { z } from 'zod';

export const actions = {
    'join-mailer': async (event) => {
        const data = await event.request.formData();
        const parsed = z.object({
            email: z.string().email(),
            name: z.string(),
        }).safeParse(data);

        if (!parsed.success) {
            throw fail(ServerCode.badRequest, {
                message: 'Invalid data',
            });
        }

        const res = await Mailer.MailingList.new({
            name: parsed.data.name,
            email: parsed.data.email,
        });

        if (res.isErr()) {
            terminal.error(res.error);
            throw fail(ServerCode.internalServerError, {
                message: 'Failed to join mailing list',
            });
        }
    }
}
import { type Writable, writable } from 'svelte/store';
import { attempt, attemptAsync } from 'ts-utils/check';
// import { Requests } from '../utils/requests';
import { Account } from './account';
import { Struct, StructData } from 'drizzle-struct/front-end';
import { type Blank } from 'drizzle-struct/front-end';
import { decode, encode } from 'ts-utils/text';
import { sse } from '$lib/utils/sse';

export namespace Permissions {
    export class PermissionError extends Error {
        constructor(message: string) {
            super(message);
            this.name = 'PermissionError';
        }
    }

    export type StructPermission<T extends Blank> = {
        property: keyof T;
        update: boolean;
        read: boolean;
    };

    type Permissions = {
        create: boolean;
        delete: boolean;

        'read-archive': boolean;
        archive: boolean;
        'restore-archive': boolean;

        'read-version-history': boolean;
        'restore-version': boolean;
        'delete-version': boolean;
    };

    export class StructProperty<T extends Blank>
        implements
            Writable<{
                property: keyof T;
                update: boolean;
                read: boolean;
            }>
    {
        public data: {
            property: keyof T;
            update: boolean;
            read: boolean;
        };

        private readonly subscribers: Set<
            (value: {
                property: keyof T;
                update: boolean;
                read: boolean;
            }) => void
        > = new Set();

        constructor(property: keyof T, update: boolean, read: boolean) {
            this.data = {
                property,
                update,
                read
            };
        }

        set(value: { property: keyof T; update: boolean; read: boolean }) {
            this.data = value;
            this.subscribers.forEach(i => i(value));
        }

        update(
            fn: (value: {
                property: keyof T;
                update: boolean;
                read: boolean;
            }) => {
                property: keyof T;
                update: boolean;
                read: boolean;
            }
        ) {
            this.set(fn(this.data));
        }

        subscribe(
            fn: (value: {
                property: keyof T;
                update: boolean;
                read: boolean;
            }) => void
        ) {
            this.subscribers.add(fn);
            fn(this.data);

            return () => {
                this.subscribers.delete(fn);
            };
        }
    }

    export class StructPermissions<T extends Blank>
        implements
            Writable<{
                properties: StructProperty<T>[];
                permissions: Permissions;
            }>
    {

        public static stringify(permissions: StructPermissions<Blank>[]) {
            return attempt(() => {
                if (!permissions.length)
                    throw new PermissionError('No permissions found');
                const roles = permissions
                    .map(i => i.role)
                    .filter((v, i, a) => a.indexOf(v) === i);
                if (roles.length > 1) {
                    throw new PermissionError('Multiple roles detected');
                }

                let str = '';

                for (const p of permissions) {
                    for (const prop of p.data.properties) {
                        if (!prop.data.property)
                            throw new PermissionError('Property not found');
                        if (prop.data.read) {
                            str +=
                                [
                                    'read',
                                    String(p.struct.data.name),
                                    String(prop.data.property)
                                ]
                                    .map(encode)
                                    .join(',') + ';';
                        }
                        if (prop.data.update && prop.data.read) {
                            str +=
                                [
                                    'update',
                                    String(p.struct.data.name),
                                    String(prop.data.property)
                                ]
                                    .map(encode)
                                    .join(',') + ';';
                        }
                    }

                    for (const [key, value] of Object.entries(
                        p.data.permissions
                    )) {
                        if (value) {
                            str +=
                                [key, String(p.struct.data.name), '']
                                    .map(encode)
                                    .join(',') + ';';
                        }
                    }
                }

                return str;
            });
        }

        public static save(permissions: StructPermissions<Blank>[]) {
            return attemptAsync(async () => {
                if (!permissions.length)
                    throw new PermissionError('No permissions found');
                const roles = permissions
                    .map(i => i.role)
                    .filter((v, i, a) => a.indexOf(v) === i);
                if (roles.length > 1) {
                    throw new PermissionError('Multiple roles detected');
                }

                const str = StructPermissions.stringify(permissions).unwrap();

                const [role] = roles;

                return (
                    await role.update((d) => ({
                        ...d,
                        permissions: str
                    }))
                ).unwrap();
            });
        }

        public static getAll(role: RoleData) {
            if (role.data.permissions === undefined) return [];
            const all: [string, string, string][] = role.data.permissions
                .split(';')
                .map(s => s.split(','))
                .map(([permission, struct, property]) => {
                    return [
                        decode(permission || ''),
                        decode(struct || ''),
                        decode(property || '')
                    ];
                });
            return Array.from(Struct.structs.values()).map(s => {
                const p = new StructPermissions(
                    s,
                    role,
                    Object.keys(s.data.structure).map(
                        i => new StructProperty(i, false, false)
                    ),
                    {
                        create: false,
                        delete: false,
                        'read-archive': false,
                        archive: false,
                        'restore-archive': false,
                        'read-version-history': false,
                        'restore-version': false,
                        'delete-version': false
                    }
                );

                const filtered = all.filter(i => i[1] === s.data.name);

                for (const [perm, _, prop] of filtered) {
                    if (prop) {
                        const property = p.data.properties.find(
                            i => i.data.property === prop
                        );
                        if (property) {
                            if (perm === 'read') {
                                property.data.read = true;
                            }
                            if (perm === 'update') {
                                property.data.update = true;
                            }
                        }
                    } else {
                        p.data.permissions[
                            perm as keyof typeof p.data.permissions
                        ] = true;
                    }
                }

                return p;
            });
        }

        private data: {
            properties: StructProperty<T>[];
            permissions: Permissions;
        };

        private readonly subscribers: Set<
            (value: {
                properties: StructProperty<T>[];
                permissions: Permissions;
            }) => void
        > = new Set();

        constructor(
            public readonly struct: Struct<T>,
            public readonly role: RoleData,
            properties: StructProperty<T>[],
            permissions: Permissions
        ) {
            this.data = {
                properties,
                permissions
            };
        }

        private _onAllUnsubscribe?: () => void;

        set(value: {
            properties: StructProperty<T>[];
            permissions: Permissions;
        }) {
            this.data = value;
            this.subscribers.forEach(i => i(value));
        }

        update(
            fn: (value: {
                properties: StructProperty<T>[];
                permissions: Permissions;
            }) => {
                properties: StructProperty<T>[];
                permissions: Permissions;
            }
        ) {
            this.set(fn(this.data));
        }

        subscribe(
            run: (value: {
                properties: StructProperty<T>[];
                permissions: Permissions;
            }) => void
        ) {
            this.subscribers.add(run);
            run(this.data);

            return () => {
                this.subscribers.delete(run);
                if (!this.subscribers.size && this._onAllUnsubscribe) {
                    this._onAllUnsubscribe();
                }
            };
        }

        onAllUnsubscribe(fn: () => void) {
            this._onAllUnsubscribe = fn;
        }

        reset() {
            return attempt(() => {

                this.set({
                    permissions: {
                        create: false,
                        delete: false,
                        'read-archive': false,
                        archive: false,
                        'restore-archive': false,
                        'read-version-history': false,
                        'restore-version': false,
                        'delete-version': false
                    },
                    properties: this.data.properties.map(
                        i =>
                            new StructProperty<T>(i.data.property, false, false)
                    )
                });
            });
        }
    }

    export const Universe = new Struct({
        name: 'Universe',
        socket: sse,
        structure: {
            name: 'string',
            description: 'string'
        }
    });

    export type UniverseData = StructData<typeof Universe.data.structure>;

    export const Role = new Struct({
        name: 'Role',
        socket: sse,
        structure: {
            name: 'string',
            universe: 'string',
            permissions: 'string', // DataPermission[]
            description: 'string',
            linkAccess: 'string' // used on the front end to show/hide links (csv)
        }
    });

    export type RoleData = StructData<typeof Role.data.structure>;

    export const RoleAccount = new Struct({
        name: 'RoleAccount',
        socket: sse,
        structure: {
            role: 'string',
            account: 'string'
        }
    });

    export const removeRole = (
        account: Account.AccountData,
        role: RoleData
    ) => {
        return attemptAsync(async () => {
            const ra = (
                await RoleAccount.fromProperty('account', account.data.id, true).await()
            ).unwrap();
            const roleAccount = ra.find(i => i.data.role === role.data.id);
            if (!roleAccount) return;
            (await roleAccount.delete()).unwrap();
        });
    };

    export const givePermissions = async (
        role: RoleData,
        permissions: unknown[]
    ) => {
        return attemptAsync(async () => {});
    };

    export const getLinks = (role: RoleData) => {
        return attempt(async () => {
            return role.data.linkAccess?.split(',') || [];
        });
    };
}

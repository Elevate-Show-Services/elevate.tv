import { text } from "drizzle-orm/pg-core";
import { Struct } from "drizzle-struct/back-end";
import { Email } from "./email";
import { PUBLIC_APP_NAME, PUBLIC_DOMAIN } from "$env/static/public";
import { PORT } from "$env/static/private";
import { HTTPS } from "$env/static/private";
import terminal from "../utils/terminal";

export namespace Mailer {
    export const MailingList = new Struct({
        name: 'mailing_list',
        structure: {
            name: text('name').notNull(),
            email: text('email').notNull().unique(),
        },
        frontend: false,
    });

    MailingList.on('create', async (mailer) => {
        const link = `${HTTPS === 'true' ? 'https' : 'http'}://${PUBLIC_DOMAIN === 'localhost' ? PUBLIC_DOMAIN + ':' + PORT : PUBLIC_DOMAIN.toLowerCase()}.com`;
        const home = await Email.createLink(link);
        const unsub = await Email.createLink(`${link}/unsubscribe/${mailer.data.email}`);
        if (home.isErr()) {
            return terminal.error(home.error);
        }
        if (unsub.isErr()) {
            return terminal.error(unsub.error);
        }
        const res = await Email.send({
            type: 'welcome',
            data: {
                url: home.value,
                name: mailer.data.name,
                unsubscribe: unsub.value,
            },
            to: mailer.data.email,
            subject: `Welcome to ${PUBLIC_APP_NAME}!`,
        });
        if (res.isErr()) {
            terminal.error(res.error);
        }
    });

    MailingList.on('delete', async (mailer) => {
        const link = `${HTTPS === 'true' ? 'https' : 'http'}://${PUBLIC_DOMAIN === 'localhost' ? PUBLIC_DOMAIN + ':' + PORT : PUBLIC_DOMAIN.toLowerCase()}.com`;
        const resub = await Email.createLink(`${link}/join/${mailer.data.email}`);
        if (resub.isErr()) {
            return terminal.error(resub.error);
        }
        const res = await Email.send({
            type: 'goodbye',
            data: {
                resubscribe: resub.value,
            },
            to: mailer.data.email,
            subject: `Goodbye from ${PUBLIC_APP_NAME}!`,
        });
        if (res.isErr()) {
            terminal.error(res.error);
        }
    });
}
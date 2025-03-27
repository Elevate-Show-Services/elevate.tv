import { text } from "drizzle-orm/pg-core";
import { Struct } from "drizzle-struct/back-end";
import { Email } from "./email";
import { PUBLIC_APP_NAME, PUBLIC_DOMAIN } from "$env/static/public";
import { PORT } from "$env/static/private";
import { HTTPS } from "$env/static/private";

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
        Email.send({
            type: 'welcome',
            data: {
                url: `${HTTPS === 'true' ? 'https' : 'http'}://${PUBLIC_DOMAIN === 'localhost' ? PUBLIC_DOMAIN + ':' + PORT : PUBLIC_DOMAIN.toLowerCase()}.com`,
                name: mailer.data.name,
            },
            to: mailer.data.email,
            subject: `Welcome to ${PUBLIC_APP_NAME}!`,
        })
    });

    MailingList.on('delete', (data) => {});
}
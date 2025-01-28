import { Account } from '$lib/server/structs/account.js';
import { Session } from '$lib/server/structs/session.js';
import { Universes } from '$lib/server/structs/universe.js';
import { fail, redirect } from '@sveltejs/kit';
import { ServerCode } from 'ts-utils/status';
import { z } from 'zod';

export const load = async (event) => {
	const error = (error: Error) => {
		console.error(error);
		return fail(ServerCode.internalServerError);
	};

	const session = await Session.getSession(event);
	if (session.isErr()) throw error(session.error);
	const account = await Session.getAccount(session.value);
	if (account.isErr()) throw error(account.error);
	if (!account.value) throw fail(ServerCode.unauthorized);

	const universes = await Universes.getUniverses(account.value);
	if (universes.isErr()) throw error(universes.error);

	const currentUniverse = await Universes.Universe.fromId(
		session.value.getUniverses().unwrap()[0] || ''
	);
	if (currentUniverse.isErr()) throw error(currentUniverse.error);

	const invitePage = parseInt(event.url.searchParams.get('invitePage') || '0');
	const inviteNumber = parseInt(event.url.searchParams.get('inviteNumber') || '0');
	const inviteOffset = invitePage * inviteNumber;
	const universePage = parseInt(event.url.searchParams.get('universePage') || '0');
	const universeNumber = parseInt(event.url.searchParams.get('universeNumber') || '0');
	const universeOffset = universePage * universeNumber;

	const invites = await Universes.getInvites(account.value, {
		type: 'array',
		limit: inviteNumber,
		offset: inviteOffset
	});

	if (invites.isErr()) throw error(invites.error);

	const publicUniverses = await Universes.Universe.fromProperty('public', true, {
		type: 'array',
		limit: universeNumber,
		offset: universeOffset
	});

	if (publicUniverses.isErr()) throw error(publicUniverses.error);

	const inviteCount = await Universes.UniverseInvites.fromProperty('account', account.value.id, {
		type: 'count'
	});

	if (inviteCount.isErr()) throw error(inviteCount.error);

	const universeCount = await Universes.Universe.fromProperty('public', true, {
		type: 'count'
	});

	if (universeCount.isErr()) throw error(universeCount.error);

	return {
		universes: universes.value.map((u) => u.safe()),
		current: currentUniverse.value?.safe(),
		invites: invites.value.map((i) => ({
			invite: i.invite.safe(),
			universe: i.universe.safe()
		})),
		publicUniverses: publicUniverses.value.map((u) => u.safe()),
		universePage,
		invitePage,
		universeNumber,
		inviteNumber,
		inviteCount: inviteCount.value,
		universeCount: universeCount.value
	};
};


export const actions = {
	create: async (event) => {
		const body = await event.request.formData();


		const res = z.object({
			name: z.string(),
			description: z.string(),
			public: z.string(),
			'agree-tos': z.string(),
		}).safeParse(Object.fromEntries(body.entries()));

		if (!res.success) {
			console.log('Zod failed:', body);
			console.error(res.error);
			throw fail(ServerCode.badRequest, {
				message: 'Invalid form data'
			});
		}

		if (res.data['agree-tos'] !== 'on') {
			throw fail(ServerCode.badRequest, {
				message: 'You must agree to the terms of service'
			});
		}

		const session = await Session.getSession(event);

		if (session.isErr()) {
			console.error(session.error);
			throw fail(ServerCode.internalServerError, {
				message: 'Failed to get session'
			});
		}

		const account = await Session.getAccount(session.value);

		if (account.isErr()) {
			console.error(account.error);
			throw fail(ServerCode.internalServerError, {
				message: 'Failed to get account'
			});
		}

		if (!account.value) {
			throw fail(ServerCode.unauthorized, {
				message: 'Not logged in'
			});
		}

		
		// const doFail = (message: string) => {
		// 	Account.notifyPopup(account.value?.id || '', {
		// 		message: 'Failed to create universe',
		// 		title: 'Error',
		// 		severity: 'danger',
		// 	})
		// 	throw fail(ServerCode.badRequest, {
		// 		success: false,
		// 		message,
		// 	});
		// }

		const universe = await Universes.createUniverse({
			name: res.data.name,
			description: res.data.description,
			public: res.data.public === 'on',
		}, account.value);

		if (universe.isErr()) {
			console.error(universe.error);
			throw fail(ServerCode.internalServerError, {
				message: 'Failed to create universe'
			});
		}

		throw redirect(303, `/universe/${universe.value.id}`);
	},
}
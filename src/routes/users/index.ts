import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createUserBodySchema, changeUserBodySchema, subscribeBodySchema } from './schemas';
import type { UserEntity } from '../../utils/DB/entities/DBUsers';
import { isUuid } from '../../utils/uuid';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<UserEntity[]> {
    return fastify.db.users.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;

      const user = await fastify.db.users.findOne({ key: 'id', equals: id });

      if (user === null) {
        throw fastify.httpErrors.notFound();
      }

      return user;
    },
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createUserBodySchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      return fastify.db.users.create(request.body);
    },
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;

      if (!isUuid(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const user = await fastify.db.users.findOne({ key: 'id', equals: id });

      if (user === null) {
        throw fastify.httpErrors.notFound();
      }

      const subscribers = await fastify.db.users.findMany({
        key: 'subscribedToUserIds',
        inArray: id,
      });

      for (const subscriber of subscribers) {
        const newSubscriberData = {
          ...subscriber,
          subscribedToUserIds: subscriber.subscribedToUserIds.filter((userId) => userId !== id),
        };

        await fastify.db.users.change(subscriber.id, newSubscriberData);
      }

      const posts = await fastify.db.posts.findMany({
        key: 'userId',
        equals: id,
      });

      for (const post of posts) {
        await fastify.db.posts.delete(post.id);
      }

      const profiles = await fastify.db.profiles.findMany({
        key: 'userId',
        equals: id,
      });

      for (const profile of profiles) {
        await fastify.db.profiles.delete(profile.id);
      }

      await fastify.db.users.delete(id);

      return user;
    },
  );

  fastify.post(
    '/:id/subscribeTo',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      const { userId } = request.body;

      if (!isUuid(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const user = await fastify.db.users.findOne({ key: 'id', equals: id });

      if (user === null) {
        throw fastify.httpErrors.notFound();
      }

      const subscribedUser = await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      });

      if (subscribedUser === null) {
        throw fastify.httpErrors.notFound();
      }

      if (subscribedUser.subscribedToUserIds.includes(id)) {
        throw fastify.httpErrors.badRequest();
      }

      subscribedUser.subscribedToUserIds.push(id);

      await fastify.db.users.change(userId, subscribedUser);

      return user;
    },
  );

  fastify.post(
    '/:id/unsubscribeFrom',
    {
      schema: {
        body: subscribeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;
      const { userId } = request.body;

      if (!isUuid(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const unsubscribedUser = await fastify.db.users.findOne({
        key: 'id',
        equals: id,
      });

      if (unsubscribedUser === null) {
        throw fastify.httpErrors.notFound();
      }

      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      });

      if (user === null) {
        throw fastify.httpErrors.notFound();
      }

      if (!user.subscribedToUserIds.includes(id)) {
        throw fastify.httpErrors.badRequest();
      }

      user.subscribedToUserIds = user.subscribedToUserIds.filter((subscribedUserId) => subscribedUserId !== id);

      await fastify.db.users.change(userId, user);

      return user;
    },
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeUserBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<UserEntity> {
      const { id } = request.params;

      if (!isUuid(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const user = await fastify.db.users.findOne({ key: 'id', equals: id });

      if (user === null) {
        throw fastify.httpErrors.notFound();
      }

      return fastify.db.users.change(id, request.body);
    },
  );
};

export default plugin;

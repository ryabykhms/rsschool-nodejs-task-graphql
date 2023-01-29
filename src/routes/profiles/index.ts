import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import type { ProfileEntity } from '../../utils/DB/entities/DBProfiles';
import { idParamSchema } from '../../utils/reusedSchemas';
import { isUuid } from '../../utils/uuid';
import { changeProfileBodySchema, createProfileBodySchema } from './schema';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<ProfileEntity[]> {
    return fastify.db.profiles.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id } = request.params;

      const profile = await fastify.db.profiles.findOne({
        key: 'id',
        equals: id,
      });

      if (profile === null) {
        throw fastify.httpErrors.notFound();
      }

      return profile;
    },
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createProfileBodySchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { userId, memberTypeId } = request.body;

      const user = await fastify.db.users.findOne({
        key: 'id',
        equals: userId,
      });

      if (user === null) {
        throw fastify.httpErrors.badRequest();
      }

      const memberType = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: memberTypeId,
      });

      if (memberType === null) {
        throw fastify.httpErrors.badRequest();
      }

      const profile = await fastify.db.profiles.findOne({
        key: 'userId',
        equals: userId,
      });

      if (profile !== null) {
        throw fastify.httpErrors.badRequest();
      }

      return fastify.db.profiles.create(request.body);
    },
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id } = request.params;

      if (!isUuid(id)) {
        throw fastify.httpErrors.badRequest();
      }

      return fastify.db.profiles.delete(id);
    },
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeProfileBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<ProfileEntity> {
      const { id } = request.params;

      if (!isUuid(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const profile = await fastify.db.profiles.findOne({ key: 'id', equals: id });

      if (profile === null) {
        throw fastify.httpErrors.notFound();
      }

      return fastify.db.profiles.change(id, request.body);
    },
  );
};

export default plugin;

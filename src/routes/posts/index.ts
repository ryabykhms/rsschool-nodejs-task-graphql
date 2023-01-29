import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { createPostBodySchema, changePostBodySchema } from './schema';
import type { PostEntity } from '../../utils/DB/entities/DBPosts';
import { isUuid } from '../../utils/uuid';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<PostEntity[]> {
    return fastify.db.posts.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params;

      const post = await fastify.db.posts.findOne({
        key: 'id',
        equals: id,
      });

      if (post === null) {
        throw fastify.httpErrors.notFound();
      }

      return post;
    },
  );

  fastify.post(
    '/',
    {
      schema: {
        body: createPostBodySchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      return fastify.db.posts.create(request.body);
    },
  );

  fastify.delete(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params;

      if (!isUuid(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const post = await fastify.db.posts.findOne({
        key: 'id',
        equals: id,
      });

      if (post === null) {
        throw fastify.httpErrors.notFound();
      }

      return fastify.db.posts.delete(id);
    },
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changePostBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<PostEntity> {
      const { id } = request.params;

      if (!isUuid(id)) {
        throw fastify.httpErrors.badRequest();
      }

      const post = await fastify.db.posts.findOne({
        key: 'id',
        equals: id,
      });

      if (post === null) {
        throw fastify.httpErrors.notFound();
      }

      return fastify.db.posts.change(id, request.body);
    },
  );
};

export default plugin;

import { FastifyPluginAsyncJsonSchemaToTs } from '@fastify/type-provider-json-schema-to-ts';
import { idParamSchema } from '../../utils/reusedSchemas';
import { changeMemberTypeBodySchema } from './schema';
import type { MemberTypeEntity } from '../../utils/DB/entities/DBMemberTypes';

const plugin: FastifyPluginAsyncJsonSchemaToTs = async (fastify): Promise<void> => {
  fastify.get('/', async function (request, reply): Promise<MemberTypeEntity[]> {
    return fastify.db.memberTypes.findMany();
  });

  fastify.get(
    '/:id',
    {
      schema: {
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const { id } = request.params;

      const memberType = await fastify.db.memberTypes.findOne({
        key: 'id',
        equals: id,
      });

      if (memberType === null) {
        throw fastify.httpErrors.notFound();
      }

      return memberType;
    },
  );

  fastify.patch(
    '/:id',
    {
      schema: {
        body: changeMemberTypeBodySchema,
        params: idParamSchema,
      },
    },
    async function (request, reply): Promise<MemberTypeEntity> {
      const { id } = request.params;

      const memberType = await fastify.db.memberTypes.findOne({ key: 'id', equals: id });

      if (memberType === null) {
        throw fastify.httpErrors.badRequest();
      }

      return fastify.db.memberTypes.change(id, request.body);
    },
  );
};

export default plugin;

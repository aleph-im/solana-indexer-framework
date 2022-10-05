import {
  GraphQLObjectType,
  GraphQLNonNull,
  GraphQLString,
  GraphQLList,
  GraphQLFloat,
  GraphQLInt,
  GraphQLBoolean,
} from 'graphql'
import { IndexerAPISchema } from '@aleph-indexer/framework'
import * as Types from './types.js'
import {
  EventsFilters,
  GlobalStatsFilters,
  APIResolver,
  ReservesFilters,
} from './resolvers.js'
import MainDomain from '../domain/main.js'

export default class APISchema extends IndexerAPISchema {
  constructor(
    protected domain: MainDomain,
    protected resolver: APIResolver = new APIResolver(domain),
  ) {
    super(domain, {
      types: Types.types,

      customTimeSeriesTypesMap: { lending: Types.LendingInfo },
      customStatsType: Types.ReserveStats,

      query: new GraphQLObjectType({
        name: 'Query',
        fields: {
          lendingMarkets: {
            type: Types.LendingMarkets,
            args: {},
            resolve: () => this.resolver.getLendingMarkets(),
          },

          reserves: {
            type: Types.Reserves,
            args: {
              lendingMarket: { type: GraphQLString },
              reserves: { type: new GraphQLList(GraphQLString) },
            },
            resolve: (_, ctx, __, info) => {
              ctx.includeStats =
                !!info.fieldNodes[0].selectionSet?.selections.find(
                  (item) =>
                    item.kind === 'Field' && item.name.value === 'stats',
                )

              return this.resolver.getReserves(ctx as ReservesFilters)
            },
          },

          events: {
            type: Types.Events,
            args: {
              reserve: { type: new GraphQLNonNull(GraphQLString) },
              account: { type: GraphQLString },
              types: { type: new GraphQLList(Types.EventType) },
              startDate: { type: GraphQLFloat },
              endDate: { type: GraphQLFloat },
              limit: { type: GraphQLInt },
              skip: { type: GraphQLInt },
              reverse: { type: GraphQLBoolean },
            },
            resolve: (_, ctx) => this.resolver.getEvents(ctx as EventsFilters),
          },

          globalStats: {
            type: Types.GlobalStatsInfo,
            args: {
              lendingMarket: { type: GraphQLString },
              reserves: { type: new GraphQLList(GraphQLString) },
            },
            resolve: (_, ctx) =>
              resolver.getGlobalStats(ctx as GlobalStatsFilters),
          },
        },
      }),
    })
  }
}

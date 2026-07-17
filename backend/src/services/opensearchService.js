import osClient from '../config/opensearch.js';
import prisma from '../config/database.js';

const MOVIES_INDEX = 'movies';
const USERS_INDEX = 'users';

const moviesMapping = {
    properties: {
        movieId: { type: 'keyword' },
        title: {
            type: 'text',
            analyzer: 'standard',
            fields: {
                keyword: { type: 'keyword' }
            }
        },
        genre: { type: 'keyword' },
        posterSource: { type: 'keyword' },
        rating: { type: 'float' },
        createdAt: { type: 'date' }
    }
};

const usersMapping = {
    properties: {
        userId: { type: 'keyword' },
        email: { type: 'keyword' },
        createdAt: { type: 'date' }
    }
};

export async function createIndices() {
    try {
        const { body: movieExists } = await osClient.indices.exists({ index: MOVIES_INDEX });
        if (!movieExists) {
            await osClient.indices.create({
                index: MOVIES_INDEX,
                body: {
                    mappings: moviesMapping,
                    settings: { number_of_shards: 1, number_of_replicas: 0 }
                }
            });
            console.log(`OpenSearch Đã tạo index "${MOVIES_INDEX}"`);
        }

        const { body: userExists } = await osClient.indices.exists({ index: USERS_INDEX });
        if (!userExists) {
            await osClient.indices.create({
                index: USERS_INDEX,
                body: {
                    mappings: usersMapping,
                    settings: { number_of_shards: 1, number_of_replicas: 0 }
                }
            });
            console.log(`OpenSearch Đã tạo index "${USERS_INDEX}"`);
        }
    } catch (error) {
        console.error('OpenSearch Lỗi tạo index:', error.message);
    }
}

export async function syncMoviesToOS() {
    try {
        const movies = await prisma.movie.findMany({
            include: { poster: true }
        });

        if (movies.length === 0) return;

        const body = movies.flatMap(movie => [
            { index: { _index: MOVIES_INDEX, _id: movie.id } },
            {
                movieId: movie.id,
                title: movie.title,
                genre: movie.genre,
                posterSource: movie.poster?.source || '',
                rating: movie.rating || 0,
                createdAt: movie.createdAt
            }
        ]);

        await osClient.bulk({ body, refresh: true });
        console.log(`Đã đồng bộ ${movies.length} movies sang OpenSearch`);
    } catch (error) {
        console.error('Lỗi đồng bộ movies:', error.message);
    }
}

export async function searchMovies(keyword, { limit = 10, offset = 0 } = {}) {
    try {
        const result = await osClient.search({
            index: MOVIES_INDEX,
            body: {
                query: {
                    bool: {
                        should: [
                            {
                                match: {
                                    title: {
                                        query: keyword,
                                        fuzziness: 'AUTO',
                                        prefix_length: 1
                                    }
                                }
                            },
                            {
                                prefix: {
                                    'title.keyword': {
                                        value: keyword.toLowerCase(),
                                        case_insensitive: true
                                    }
                                }
                            },
                            {
                                wildcard: {
                                    'title.keyword': {
                                        value: `*${keyword.toLowerCase()}*`,
                                        case_insensitive: true
                                    }
                                }
                            }
                        ],
                        minimum_should_match: 1
                    }
                },
                from: offset,
                size: limit
            }
        });

        const hits = result.body ? result.body.hits : result.hits;
        return {
            movies: hits.hits.map(hit => ({
                id: hit._id,
                ...hit._source,
                score: hit._score
            })),
            total: typeof hits.total === 'object' ? hits.total.value : hits.total
        };
    } catch (error) {
        console.error('OpenSearch Lỗi tìm kiếm phim:', error.message);
        return { movies: [], total: 0 };
    }
}

export async function resetIndices() {
    try {
        const { body: movieExists } = await osClient.indices.exists({ index: MOVIES_INDEX });
        if (movieExists) {
            await osClient.indices.delete({ index: MOVIES_INDEX });
            console.log(`OpenSearch Đã xóa index "${MOVIES_INDEX}"`);
        }

        const { body: userExists } = await osClient.indices.exists({ index: USERS_INDEX });
        if (userExists) {
            await osClient.indices.delete({ index: USERS_INDEX });
            console.log(`OpenSearch Đã xóa index "${USERS_INDEX}"`);
        }

        await createIndices();
        console.log('OpenSearch Đã reset và tạo lại indexes');
    } catch (error) {
        console.error('OpenSearch Lỗi reset:', error.message);
    }
}

export async function initOpenSearch() {
    await createIndices();
    await syncMoviesToOS();
}

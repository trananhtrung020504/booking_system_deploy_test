'use client';

import { useState } from 'react';
import Link from 'next/link';
import { Film, Star, Clock, ChevronRight, Search, Filter, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { useGetMoviesQuery, useGetGenresQuery } from '@/store/api/movieAPI';
import type { Movie, GetMoviesParams } from '@/types';

function MovieCard({ movie, index }: { movie: Movie; index: number }) {
  return (
    <Link href={`/movies/${movie.id}`}>
      <div
        className="gsap-card luxury-sheen group relative rounded-xl overflow-hidden bg-card border border-border/50 hover:border-primary/50 transition-all duration-300 animate-fade-in"
        style={{ animationDelay: `${index * 60}ms` }}
      >
        <div className="relative aspect-[2/3] overflow-hidden">
          {movie.poster?.source ? (
            <img
              src={movie.poster.source}
              alt={movie.title}
              className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-105"
            />
          ) : (
            <div className="w-full h-full bg-muted flex items-center justify-center">
              <Film className="h-12 w-12 text-muted-foreground" />
            </div>
          )}
          <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/20 to-transparent" />

          {movie.rating && (
            <div className="absolute top-3 right-3 flex items-center gap-1 bg-black/60 backdrop-blur-sm rounded-full px-2.5 py-1">
              <Star className="h-3.5 w-3.5 text-cinema-gold fill-cinema-gold" />
              <span className="text-sm font-semibold text-white">{movie.rating}</span>
            </div>
          )}

          <div className="absolute top-3 left-3 flex flex-wrap gap-1">
            {movie.format?.map((f) => (
              <Badge key={f} variant="secondary" className="text-[10px] bg-primary/80 text-white border-0">
                {f}
              </Badge>
            ))}
          </div>

          <div className="absolute bottom-0 left-0 right-0 p-3">
            <h3 className="text-sm md:text-base font-bold text-white line-clamp-2 mb-1">
              {movie.title}
            </h3>
            <div className="flex items-center gap-2 text-xs text-white/70">
              <Clock className="h-3 w-3" />
              <span>{movie.duration} phút</span>
              <span>•</span>
              <span>{movie.certification}</span>
            </div>
          </div>
        </div>

        <div className="p-3 flex items-center justify-between">
          <div className="flex flex-wrap gap-1">
            {movie.genre?.slice(0, 2).map((g) => (
              <Badge key={g} variant="outline" className="text-[10px]">
                {g}
              </Badge>
            ))}
          </div>
          <Button variant="ghost" size="sm" className="h-7 gap-1 text-xs text-primary">
            Đặt vé
            <ChevronRight className="h-3 w-3" />
          </Button>
        </div>
      </div>
    </Link>
  );
}

export default function MoviesPage() {
  const [params, setParams] = useState<GetMoviesParams>({
    page: 1,
    limit: 12,
    sort: 'releaseDate',
  });
  const [searchInput, setSearchInput] = useState('');

  const { data, isLoading } = useGetMoviesQuery(params);
  const { data: genres } = useGetGenresQuery();

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setParams((prev) => ({ ...prev, search: searchInput || undefined, page: 1 }));
  };

  const handleGenreFilter = (genre: string) => {
    setParams((prev) => ({
      ...prev,
      genre: prev.genre === genre ? undefined : genre,
      page: 1,
    }));
  };

  const handleSort = (sort: 'releaseDate' | 'rating' | 'title') => {
    setParams((prev) => ({ ...prev, sort, page: 1 }));
  };

  const clearFilters = () => {
    setParams({ page: 1, limit: 12, sort: 'releaseDate' });
    setSearchInput('');
  };

  const hasFilters = params.genre || params.search;

  return (
    <div className="container mx-auto px-4 py-8">
      {/* Header */}
      <div data-gsap-hero className="mb-8">
        <h1 className="text-3xl font-bold mb-2">Phim đang chiếu</h1>
        <p className="text-muted-foreground">Khám phá và đặt vé cho những bộ phim hay nhất</p>
      </div>

      {/* Search & Filters */}
      <div data-gsap-reveal className="space-y-4 mb-8">
        <form onSubmit={handleSearch} className="flex gap-2">
          <div className="relative flex-1 max-w-md">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Tìm kiếm phim..."
              value={searchInput}
              onChange={(e) => setSearchInput(e.target.value)}
              className="pl-10"
            />
          </div>
          <Button type="submit" variant="secondary">
            Tìm
          </Button>
        </form>

        {/* Genre filters */}
        <div className="flex flex-wrap gap-2 items-center">
          <Filter className="h-4 w-4 text-muted-foreground" />
          {genres?.map((genre) => (
            <Button
              key={genre}
              variant={params.genre === genre ? 'default' : 'outline'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleGenreFilter(genre)}
            >
              {genre}
            </Button>
          ))}
          {hasFilters && (
            <Button variant="ghost" size="sm" className="h-7 text-xs text-destructive gap-1" onClick={clearFilters}>
              <X className="h-3 w-3" />
              Xóa bộ lọc
            </Button>
          )}
        </div>

        {/* Sort */}
        <div className="flex gap-2 items-center text-sm">
          <span className="text-muted-foreground">Sắp xếp:</span>
          {[
            { key: 'releaseDate' as const, label: 'Mới nhất' },
            { key: 'rating' as const, label: 'Đánh giá' },
            { key: 'title' as const, label: 'Tên phim' },
          ].map((sort) => (
            <Button
              key={sort.key}
              variant={params.sort === sort.key ? 'secondary' : 'ghost'}
              size="sm"
              className="h-7 text-xs"
              onClick={() => handleSort(sort.key)}
            >
              {sort.label}
            </Button>
          ))}
        </div>
      </div>

      {/* Movies Grid */}
      <div data-gsap-reveal className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-4 lg:grid-cols-6 gap-4">
        {isLoading
          ? Array.from({ length: 12 }).map((_, i) => (
              <div key={i} className="rounded-xl overflow-hidden bg-card border border-border/50">
                <Skeleton className="aspect-[2/3] w-full" />
                <div className="p-3 space-y-2">
                  <Skeleton className="h-4 w-2/3" />
                  <Skeleton className="h-3 w-1/3" />
                </div>
              </div>
            ))
          : data?.movies?.map((movie, index) => (
              <MovieCard key={movie.id} movie={movie} index={index} />
            ))}
      </div>

      {/* Empty state */}
      {!isLoading && (!data?.movies || data.movies.length === 0) && (
        <div className="text-center py-20">
          <Film className="h-16 w-16 mx-auto text-muted-foreground/30 mb-4" />
          <p className="text-muted-foreground">Không tìm thấy phim nào phù hợp.</p>
          {hasFilters && (
            <Button variant="link" onClick={clearFilters} className="mt-2">
              Xóa bộ lọc
            </Button>
          )}
        </div>
      )}

      {/* Pagination */}
      {data?.pagination && data.pagination.totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-8">
          <Button
            variant="outline"
            size="sm"
            disabled={data.pagination.page <= 1}
            onClick={() => setParams((prev) => ({ ...prev, page: (prev.page || 1) - 1 }))}
          >
            Trước
          </Button>
          <span className="text-sm text-muted-foreground px-4">
            Trang {data.pagination.page} / {data.pagination.totalPages}
          </span>
          <Button
            variant="outline"
            size="sm"
            disabled={data.pagination.page >= data.pagination.totalPages}
            onClick={() => setParams((prev) => ({ ...prev, page: (prev.page || 1) + 1 }))}
          >
            Tiếp
          </Button>
        </div>
      )}
    </div>
  );
}

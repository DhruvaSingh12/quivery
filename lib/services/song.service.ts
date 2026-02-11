import { Tables } from "@/types_db";
import { Song, Artist, Album } from "@/types";

// Type definitions for the raw response from Supabase when joining tables
export type SongRow = Tables<"songs">;
export type ArtistRow = Tables<"artists">;
export type AlbumRow = Tables<"albums">;

// Define the joined structure explicitly based on our query
// We use a type that mirrors the actual structure returned by the standard relational query
export interface SongWithRelations extends SongRow {
    album: AlbumRow | null;
    song_artists: {
        artists: ArtistRow | null;
    }[];
}

// The standardized query string for fetching songs with their relationships
// Using `*` for the main table, and explicit joins for related data
export const SONG_QUERY = `
  *,
  album:album_id(*),
  song_artists(
    artists(*)
  )
`;

/**
 * Maps a raw database song result (with joins) to the Domain Song Entity.
 * @param row The raw row from Supabase query
 * @returns Domain Song object or null if invalid
 */
export const mapToDomainSong = (row: any): Song | null => {
    if (!row) return null;

    // Safety check for required fields (runtime validation)
    if (!row.id || !row.title) {
        return null;
    }

    // Cast to our known structure for easier access
    const data = row as SongWithRelations;

    // Map Artists
    const artists: Artist[] = data.song_artists
        ?.map((sa) => sa.artists)
        .filter((a): a is ArtistRow => !!a)
        .map(a => ({
            id: a.id,
            name: a.name,
            created_at: a.created_at
        })) || [];

    // Map Album
    const album: Album | null = data.album ? {
        id: data.album.id,
        title: data.album.title,
        created_at: data.album.created_at
    } : null;

    return {
        id: data.id,
        user_id: data.user_id,
        title: data.title,
        song_path: data.song_path,
        image_path: data.image_path,
        lyrics_path: data.lyrics_path || null,
        created_at: data.created_at,
        album_id: data.album_id,
        duration: data.duration,
        artists,
        album
    };
};

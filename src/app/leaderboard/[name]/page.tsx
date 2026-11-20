import type { Metadata } from 'next';
import { notFound } from 'next/navigation';
import { publicCaller } from '~/server/caller';
import { ordinal } from '~/utils/ordinal';
import { placePath } from '~/utils/sharePlace';
import { LeaderboardApp } from '../_components/LeaderboardApp';
import { findPlace } from './place';

interface PlacePageProps {
  params: Promise<{ name: string }>;
}

const number = (value: number) => value.toLocaleString('en');

export const generateMetadata = async ({
  params,
}: PlacePageProps): Promise<Metadata> => {
  const place = await findPlace((await params).name);
  if (!place) return { title: 'High scores · Bass Weapons' };
  const where = place.rank === null ? 'on' : `${ordinal(place.rank)} on`;
  const title = `${place.name} is ${where} the Bass Weapons high scores`;
  const description = `${number(place.totalPoints)} points from ${number(place.runsCount)} runs. Every gun is a bass synth and every shot lands on the beat: play in your browser and beat it.`;
  return {
    title,
    description,
    alternates: { canonical: placePath(place.name) },
    openGraph: {
      type: 'website',
      siteName: 'Bass Weapons',
      url: placePath(place.name),
      title,
      description,
    },
    twitter: { card: 'summary_large_image', title, description },
  };
};

const PlacePage = async ({ params }: PlacePageProps) => {
  const place = await findPlace((await params).name);
  if (!place) notFound();
  const initialBoard = await publicCaller()
    .board.top()
    .catch(() => null);
  return <LeaderboardApp initialBoard={initialBoard} shared={place} />;
};

export default PlacePage;

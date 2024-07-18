import { clearScreenDown } from 'readline';
import { LIGHT_NOVELS } from '../../src/providers';

jest.setTimeout(120000);

const animedailynovels = new LIGHT_NOVELS.AnimeDailyNovels();

test('returns a filled array of light novels', async () => {
  const data = await animedailynovels.search('slime');
  expect(data.results).not.toEqual([]);
});

test('returns a filled object of light novel info', async () => {
  const data = await animedailynovels.fetchLightNovelInfo('tensei-shitara-slime-datta-ken', 1);
  expect(data.chapters).not.toEqual([]);
  expect(data.description).not.toEqual('');
});
test('returns a filled object of the latest light novels', async () => {
  const data = await animedailynovels.fetchNovelList("latest-release", 2);
  expect(data.results).not.toEqual([]);
});
test('returns a filled array of the genres', async () => {
  const data = await animedailynovels.fetchGenreList();
  expect(data.results).not.toEqual([]);
});

test('ensure we get content from page', async () => {
  const data = await animedailynovels.fetchChapterContent("reincarnation-of-the-strongest-sword-god-novel/chapter-1");
  expect(data).not.toEqual([]);
});
test('Should print out the list of chapters from the 2nd page', async () => {
  const data = await animedailynovels.fetchLightNovelInfo('reincarnation-of-the-strongest-sword-god-novel/chapter-1', 2);
  expect(data).not.toEqual([]);
});
test('Should print out the list of chapters from the 3rd page', async () => {
  const data = await animedailynovels.fetchLightNovelInfo('reincarnation-of-the-strongest-sword-god-novel/chapter-1', 3);
  expect(data).not.toEqual([]);
});

test('Should print out the list of novels that match the search', async () => {
  const data = await animedailynovels.search('Gala');
  expect(data).not.toEqual([]);
});

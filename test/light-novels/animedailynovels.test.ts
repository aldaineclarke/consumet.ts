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
  const data = await animedailynovels.fetchNovelList('complete-novels');
  expect(data.results).not.toEqual([]);
});
test('returns a filled array of the genres', async () => {
  const data = await animedailynovels.fetchGenreList();
  expect(data.results).not.toEqual([]);
});
test('returns a filled array of the light novels of that genre', async () => {
  const data = await animedailynovels.fetchNovelList("Video Games");
  expect(data.results).not.toEqual([]);
});
import { LightNovelParser, ISearch, ILightNovelInfo, ILightNovelChapterContent, ILightNovelResult } from '../../models';
declare class AnimeDailyNovels extends LightNovelParser {
    readonly name = "Read Light Novels";
    protected baseUrl: string;
    protected logo: string;
    protected classPath: string;
    /**
     *
     * @param lightNovelUrl light novel link or id
     * @param chapterPage chapter page number (optional) if not provided, will fetch all chapter pages.
     */
    fetchLightNovelInfo: (lightNovelUrl: string, chapterPage?: number) => Promise<ILightNovelInfo>;
    private fetchChapters;
    private fetchAllChapters;
    /**
     *
     * @param chapterId chapter id or url
     */
    fetchChapterContent: (chapterId: string) => Promise<ILightNovelChapterContent>;
    /**
     *
     * @param query search query string
     */
    search: (query: string) => Promise<ISearch<ILightNovelResult>>;
    /**
     * @description This method fetches the different list of novels by accepting the list you wish to fetch then returning the list of light novels in that list
     * @param novelList Novel list to fetch
     */
    fetchNovelList: (novelList: NovelListType | string) => Promise<ISearch<ILightNovelResult>>;
    /**
     * @description This method fetches the different list of novels by accepting the list you wish to fetch then returning the list of light novels in that list
     * @param novelList Novel list to fetch
     */
    fetchGenreList: (pageWithGenre?: string) => Promise<{
        results: Array<String>;
    }>;
}
type NovelListType = "latest-release" | "complete-novels" | "complete-novels" | "most-popular" | "front";
export default AnimeDailyNovels;

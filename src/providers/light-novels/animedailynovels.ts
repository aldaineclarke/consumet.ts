import { load } from 'cheerio';
import FormData from 'form-data';

import {
  LightNovelParser,
  ISearch,
  ILightNovelInfo,
  ILightNovelChapter,
  ILightNovelChapterContent,
  ILightNovelResult,
  MediaStatus,
} from '../../models';
import { USER_AGENT } from '../../utils';
class AnimeDailyNovels extends LightNovelParser {
  override readonly name = 'Read Light Novels';
  protected override baseUrl = 'https://animedaily.net';

  protected override logo = 'https://i.imgur.com/RDPjbc6.png';
  protected override classPath = 'LIGHT_NOVELS.AnimeDailyNovels';

  /**
   *
   * @param lightNovelUrl light novel link or id
   * @param chapterPage chapter page number (optional) if not provided, will fetch all chapter pages.
   */
  override fetchLightNovelInfo = async (
    lightNovelUrl: string,
    chapterPage: number = -1
  ): Promise<ILightNovelInfo> => {
    if (!lightNovelUrl.startsWith(this.baseUrl)) {
      lightNovelUrl = `${this.baseUrl}/${lightNovelUrl}.html`;
    }
    const lightNovelInfo: ILightNovelInfo = {
      id: lightNovelUrl.split('/')?.pop()?.replace('.html', '')!,
      title: '',
      url: lightNovelUrl,
    };

    try {
      const page = await this.client.get(lightNovelUrl, {
        headers: {
          Referer: lightNovelUrl,
        },
      });

      const $ = load(page.data);

      const novelId = parseInt($('#id_post').val() as string);
      lightNovelInfo.title = $('div.col-xs-12.col-sm-8.col-md-8.desc > h3').text();
      lightNovelInfo.image = $('div.col-xs-12.col-sm-4.col-md-4.info-holder > div.books > div > img').attr(
        'src'
      );
      lightNovelInfo.author = $(
        'div.col-xs-12.col-sm-4.col-md-4.info-holder > div.info > div:nth-child(1)  a'
      ).text();
      lightNovelInfo.genres = $(
        ' div.col-xs-12.col-sm-4.col-md-4.info-holder > div.info > div:nth-child(2)  a'
      )
        .map((i, el) => $(el).text())
        .get();

      const val  = $(
        'div.col-xs-12.col-sm-8.col-md-8.desc > div:nth-child(3) > div > span:nth-of-type(1)'
      ).text();
      lightNovelInfo.rating = parseFloat(
        val
      );
      lightNovelInfo.views = parseInt(
        $('div.col-xs-12.col-sm-4.col-md-4.info-holder > div.info > div:nth-child(4) > span').text()
      );
      // The chapters are laid out right to left with two elements with last-list class this should ensure we get the correct final chapter
      var lastChapters = $('div#new-chapter.col-xs-12 > div:nth-child(2) > div > ul > li.last-list').get();
      if(lastChapters.length > 1){
        lightNovelInfo.lastChapter = $('div#new-chapter.col-xs-12 > div:nth-child(2) > div > ul > li.last-list.chap-right5 > a').attr()?.title;
      }else{
        lightNovelInfo.lastChapter = $('div#new-chapter.col-xs-12 > div:nth-child(2) > div > ul > li:last-of-type > a').attr()?.title;
      }

      lightNovelInfo.description = $('div.col-xs-12.col-sm-8.col-md-8.desc > div.desc-text > hr')
        .eq(0)
        .nextUntil('hr')
        .text();
      const pages = Math.max(
        ...$('#pagination > ul > li')
          .map((i, el) => parseInt($(el).find('a').attr('data-page')!))
          .get()
          .filter(x => !isNaN(x))
      );

      switch ($('div.col-xs-12.col-sm-4.col-md-4.info-holder > div.info > div:last-child > span').text()) {
        case 'Completed':
          lightNovelInfo.status = MediaStatus.COMPLETED;
          break;
        case 'On Going':
          lightNovelInfo.status = MediaStatus.ONGOING;
          break;
        default:
          lightNovelInfo.status = MediaStatus.UNKNOWN;
          break;
      }

      lightNovelInfo.pages = pages;
      lightNovelInfo.chapters = [];
      if (chapterPage === -1) {
        lightNovelInfo.chapters = await this.fetchAllChapters(novelId, pages, lightNovelUrl);
      } else {
        lightNovelInfo.chapters = await this.fetchChapters(novelId, chapterPage, lightNovelUrl);
      }  
      return lightNovelInfo;

    } catch (err) {
      throw new Error((err as Error).message);
    }
  };
  
  private fetchChapters = async (
    novelId: number,
    chapterPage: number,
    referer: string
  ): Promise<ILightNovelChapter[]> => {
    const chapters: ILightNovelChapter[] = [];

    const bodyFormData = new FormData();
    bodyFormData.append('action', 'tw_ajax');
    bodyFormData.append('type', 'pagination');
    bodyFormData.append('page', chapterPage);
    bodyFormData.append('id', novelId);

    const page = await this.client({
      method: 'post',
      url: `${this.baseUrl}/wp-admin/admin-ajax.php`,
      data: bodyFormData,
      headers: {
        referer: referer,
        'content-type': 'multipart/form-data',
        origin: this.baseUrl,
        'user-agent': USER_AGENT,
      },
    });

    const $ = load(page.data.list_chap);

    for (const chapter of $('ul.list-chapter > li')) {
      const subId = $(chapter).find('a').attr('href')!.split('/')?.pop()!.replace('.html', '')!;
      const id = $(chapter).find('a').attr('href')!.split('/')[3];
      chapters.push({
        id: `${id}/${subId}`,
        title: $(chapter).find('a > span').text().trim(),
        url: $(chapter).find('a').attr('href'),
      });
    }
    return chapters;
  };
  private fetchAllChapters = async (novelId: number, pages: number, referer: string): Promise<any> => {
    const chapters: ILightNovelChapter[] = [];

    for (const pageNumber of Array.from({ length: pages }, (_, i) => i + 1)) {
      const chaptersPage = await this.fetchChapters(novelId, pageNumber, referer);
      chapters.push(...chaptersPage);
    }
    return chapters;
  };

  private fetchChapterBy = async (novelId: number, pages: number, referer: string): Promise<any> => {
    const chapters: ILightNovelChapter[] = [];

    for (const pageNumber of Array.from({ length: pages }, (_, i) => i + 1)) {
      const chaptersPage = await this.fetchChapters(novelId, pageNumber, referer);
      chapters.push(...chaptersPage);
    }
    return chapters;
  };

  /**
   *
   * @param chapterId chapter id or url
   */
  override fetchChapterContent = async (chapterId: string): Promise<ILightNovelChapterContent> => {
    if (!chapterId.startsWith(this.baseUrl)) {
      chapterId = `${this.baseUrl}/${chapterId}.html`;
    }
    const contents: ILightNovelChapterContent = {
      novelTitle: '',
      chapterTitle: '',
      text: '',
    };

    try {
      const page = await this.client.get(chapterId);
      const $ = load(page.data);

      contents.novelTitle = $('.truyen-title').text();
      contents.chapterTitle = $('.chapter-title').text();
      for (const line of $('div.chapter-content > p')) {
        if ($(line).text() != '﻿') {
          contents.text += `${$(line).text()}\n`;
        }
      }
      return contents;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };

  /**
   *
   * @param query search query string
   */
  override search = async (query: string, page?:number): Promise<ISearch<ILightNovelResult>> => {
    const result: ISearch<ILightNovelResult> = { results: [] };
    try {
      const res = await this.client.post(`${this.baseUrl}/page/${page ?? 1}?s=${query}`);
      const $ = load(res.data);

      $(
        'div.col-xs-12.col-sm-12.col-md-9.col-truyen-main > div:nth-child(1) > div > div:nth-child(1)  div.col-md-3.col-sm-6.col-xs-6.home-truyendecu'
      ).each((i, el) => {
        result.results.push({
          id: $(el).find('a').attr('href')?.split('/')[3]!.replace('.html', '')!,
          title: $(el).find('a > h3').text(),
          url: $(el).find('a').attr('href')!,
          genres: $(el).find('div.chuyen-muc').attr()?.title?.split(","),
          image: $(el).find('a > img').attr('src'),
          lastChapter: $(el).find('.chapter-name').attr()?.title,
          status: $(el).find('small > span.hoan-thanh').text()?.toLocaleLowerCase() == "full" ? MediaStatus.COMPLETED : MediaStatus.ONGOING
        });
      });
      // have a check to see if the pagination exists before allowing to fetch other pages
      return result;
    } catch (err) {
      
      throw new Error((err as Error).message);
    }
  };
  /**
   * @description This method fetches the different list of novels by accepting the list you wish to fetch then returning the list of light novels in that list
   * @param novelList Novel list to fetch
   */
  fetchNovelList = async (novelList: NovelListType | string, page: number): Promise<ISearch<ILightNovelResult>> => {
    const result: ISearch<ILightNovelResult> = { results: [] };
    const searchType = novelList.replace(" ", "-").toLocaleLowerCase() ?? 'latest-release';
    try {
      const res = await this.client.get(`${this.baseUrl}/${searchType}/page/${page}`);
      const $ = load(res.data);

      $(
        'div.col-xs-12.col-sm-12.col-md-9.col-truyen-main > div:nth-child(1) > div > div:nth-child(1)  div.col-md-3.col-sm-6.col-xs-6.home-truyendecu'
      ).each((i, el) => {

        result.results.push({
          id: $(el).find('a').attr('href')?.split('/')[3]!.replace('.html', '')!,
          title: $(el).find('div.caption > a  h3').text(),
          url: $(el).find('a').attr('href')!,
          // if only one genre is on the novel it will not have the genre in the parent title attribute.
          genres: $(el).find('div.chuyen-muc').attr()!.title?.split(",") ?? $(el).find('div.chuyen-muc a').attr()!.title?.split(","),
          image: $(el).find('a > img').attr('src'),
          lastChapter: $(el).find('div.tt-status  span.chapter-name').attr("title"),
        });
      });
      return result;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };
  /**
   * @description This method fetches the different list of novels by accepting the list you wish to fetch then returning the list of light novels in that list
   * @param novelList Novel list to fetch
   */
  fetchGenreList = async (pageWithGenre = "front"): Promise<{results: Array<String>}> => {
    const result: {results:string[]}= { results: [] };
    try {
      const res = await this.client.post(`${this.baseUrl}/${pageWithGenre}`);
      const $ = load(res.data);

      $(
        'div.col-md-4.col-truyen-side > div:nth-child(1) > div:nth-child(2)  .index-cate'
      ).each((i, el) => {
        result.results.push($(el).find('a').attr()!.title);
      });
      return result;
    } catch (err) {
      throw new Error((err as Error).message);
    }
  };
}

type NovelListType="latest-release" | "complete-novels" | "complete-novels" | "most-popular" | "front";

export default AnimeDailyNovels;

// (async () => {
//   const ln = new ReadLightNovels();
//   const chap = await ln.fetchChapterContent('youkoso-jitsuryoku-shijou-shugi-no-kyoushitsu-e/volume-1-prologue-the-structure-of-japanese-society');
// })();

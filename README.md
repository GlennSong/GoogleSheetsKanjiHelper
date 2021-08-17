# GoogleSheetsKanjiHelper
Google spreadsheet tool to help pull Kanji and related vocabulary words from text.

# Overview 

So, I've been reading a Japanese novel to teach myself how to read Japanese. It's either a brilliant idea or a dumb one. I was manually looking up kanji and vocabulary so I thought a tool could help me do that. Turns out I couldn't find anything and it seemed like a fun programming challenge. I took most of the afternoon and evening to put it together so it's probably janky and buggy.

I developed these Google spreadsheet tools to help me learn Kanji and related vocabulary while reading a book. I was doing the work by hand copying down kanji characters I didn't know and looking up the definition and readings, but that was a slow process. These tools are meant to help me pull that information together faster when used in combination with an OCR scanner (such as the Google Translate app).

I'm not 100% sure if it'll help me or just be a crutch, but hey, it's a tool and maybe you might think it's useful for your learning needs.

# How It Works

First you need some text. I tested using Google Translate's app and took a photo of a page from the book I'm reading. From there I allowed Google Translate to scan it and detect the characters via it's OCR system. It does an okay job. There are some characters that come out wrong, but I can deal with that by manually looking them up. Once you have the text add it to a google spreadsheet.

Add these tools to your google spreadsheet document and give it permission to fetch data from the third party API [kanjiapi](https://kanjiapi.dev/). You're probably wondering how you can do that, or why I didn't deploy this as a script add-on to Google Spreadsheet. I didn't deploy it because I didn't feel like it. Maybe I'll do it later. Goto Tools->Script Editor and copy and paste the code into there. Then set the permissions and it should run for your spreadsheet.

# Function Calls

To get a list of unique kanji call:

```=buildKanjiTable(A1)```

'A1' is the cell where you stashed your text, but you can stash it where ever, just pass it the right cell. This function will go through the text and pull out all of the unique kanji characters and build a table of the characters, konyomi reading, onyomi reading, definition, grade school level, and number of times it saw it in the text. 

To build a partial list of vocabulary call: 

```=buildJapaneseWordTable(A1)```

It uses the same text and runs through building words and tries to find the Hiragana and English definition. It won't find all of the vocabulary, because I don't know how to do that yet. For instance verbs aren't caught since the algorithm does exact matching with the words found in via the API. Anything that's a mix of Kanji and Kana are ignored as well, it's purely for just Kanji words. So, that's something... 


If you want to run both the Kanji and Vocab builder use this: 

```=BuildJapaneseWorksheet(A1) ```

I don't call this and who knows if it works. I don't call it because fetching data from the API and processing it causes it to time out. Turns out Google has a limit on how long a process can execute.

# Usage with Anki

One additional thing you can do with a spreadsheet of Kanji and vocabulary data is to import it into Anki and turn it into flashcards. It's not to difficult to do that part either.

Here's how: 

1. I got the [Spreadsheet Import Plus add-on for Anki](https://ankiweb.net/shared/info/716643677). Follow the instructions there to install it into Anki.
2. With this add-on you have to build your Google Spreadsheet in a specific format. The required layout info is in the link above, but it wasn't that hard to do. I'm a dummy about instructions and I got it the first try. If you're using my functions above you'll probably want to copy/paste the resultant Kanji table to a new google spreadsheet document, format it properly for the add-on, and export that as a Microsoft Excel spreadsheet. I also added the "tags" field so I could take advantage of Anki's tagging system.
3. Before you import into Anki, make sure you have your own Anki card type setup. I cloned a basic one and added the necessary fields for the kanji, onyomi, konyomi, etc. 
4. Make a new empty deck in Anki
5. Import is as easy as file->open in Anki and selecting your spreadsheet.
6. It'll ask you where to map your data. Make sure your new card type and empty deck are selected. When you're good let Anki do it's biz.
7. You should have a deck full of kanji to study in the end. Or vocabulary. Or both. The sky's the limit.

# Support

As long as I'm finding the tools useful I'll fix bugs and issues with it. If you want to discuss new features, I'm game to listen, but I built these tools for my needs, so any new implementation will probably be low priority.

# Links
[Documentation for kanjiapi](https://kanjiapi.dev/#!/documentation)

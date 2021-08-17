/* 
Kanji Helper tools for Google Spreadsheet 
Generates a list of unique kanji from a chunk of text as well as a partial list of vocabulary words based on the text. The vocabulary words are kanji only. Anything that's a mixture of kana and kanji such as verbs or whatever don't show up in the list right now.
Author: Glenn Song
Date: 8/16/2021
Version 0.1 

Could be buggy!
*/

/**
 To get product of three numbers
 
 @param num1 Enter the first number
 @param num2 Enter the second number
 @param num3 Enter the third number
 @customfunction
 */
function testfunc(num1, num2, num3) {
  return num1 * num2 * num3;  
}

const kMinWordLen = 2;

/**
 * getKanji uses a third party API to pull in Kanji data. 
 * 
 * @param kanjiChar - the Japanese character to get data for.
 * @customfunction
 */
function getKanji(kanjiChar) 
{
  //format as a two-dimensional array for google spreadsheet.
  return [getKanjiArray(kanjiChar)];
}

function getKanjiArray(kanjiChar) 
{
  var url = "https://kanjiapi.dev/v1/kanji/" + kanjiChar;
  var response = UrlFetchApp.fetch(url);
  var json = response.getContentText();
  var data = JSON.parse(json);
  //Logger.log(data);

  var kun_reading = "";
  if(data["kun_readings"].length > 0)
  {
    kun_reading = data["kun_readings"][0];
  }

  var on_reading = "";
  if(data["on_readings"].length > 0)
  {
    on_reading = data["on_readings"][0];
  }

  return [kun_reading, on_reading, data["grade"], data["meanings"].join(', ')];
}

/** 
 * Given a character string in kanji, find a word by feeding the first character into the api call.
 * Note: This won't find verbs most likely...
 * 
 * @param getJapaneseWord - the Japanese character to get data for.
 * @customfunction
 */
function getJapaneseWord(kanjiStr) 
{
  var data = getJapaneseWordData(kanjiStr);
  if(data !== null) 
  {
    return [[kanjiStr, data.pronounced, data.meanings]];
  }
  else 
  {
    return [[kanjiStr, "none", "no definition"]];
  }
}

//This version of the function can return more than one word potentially.
function getJapaneseWords(kanjiSearchChar, permutationList) 
{
  var url = "https://kanjiapi.dev/v1/words/" + kanjiSearchChar;
  var response = UrlFetchApp.fetch(url);
  var json = response.getContentText();
  var data = JSON.parse(json);

  var results = [];

  //run through the list of results and find the one that matches the kanji string.
  for(var setIndex = 0; setIndex < data.length; ++setIndex)
  {
    var variantSet = data[setIndex];
    for(var index = 0; index < variantSet.variants.length; ++index)
    {
      var variantInfo = variantSet.variants[index];

      //search against all of the permutations that start with the character.
      for(var perIndex = 0; perIndex < permutationList.length; ++perIndex) 
      {
        if(variantInfo.written == permutationList[perIndex]) 
        {
          //get the meanings
          var meanings = null;
          if(variantSet.meanings.length > 0) 
          {
            meanings = variantSet.meanings[0].glosses.join(', ');
          }

          results.push({
            "word" : variantInfo.written,
            "pronounced" : variantInfo.pronounced,
            "meanings" : meanings
          });
        }
      }
    }
  }

  return results;
}

function getJapaneseWordData(kanjiStr) 
{
  if(kanjiStr.length <= 0)
  {
    return null;
  }

  var firstKanji = kanjiStr[0]

  var url = "https://kanjiapi.dev/v1/words/" + firstKanji;
  var response = UrlFetchApp.fetch(url);
  var json = response.getContentText();
  var data = JSON.parse(json);

  //run through the list of results and find the one that matches the kanji string.
  for(var setIndex = 0; setIndex < data.length; ++setIndex)
  {
    var variantSet = data[setIndex];
    for(var index = 0; index < variantSet.variants.length; ++index)
    {
      var variantInfo = variantSet.variants[index];
      if(variantInfo.written == kanjiStr) 
      {
        //get the meanings
        var meanings = null;
        if(variantSet.meanings.length > 0) 
        {
          meanings = variantSet.meanings[0].glosses.join(', ');
        }

        return {
          "pronounced" : variantInfo.pronounced,
          "meanings" : meanings
        }
      }
    }
  }

  return null;  
}


//we have a blob of kanji... it could be a word or multiple words, but how do we know?
//we'll have to look at every permutation since we're not to smart. Carve the kanji up
//into substrings.
//
//Because the API we're using searches via the first character and returns all words
//starting with that character, we want a dictionary of start characters to permutations
//so we can pass in the search permutations.
function buildPermutationDic(buffer) 
{
  var permutationDic = {};

  //Logger.log("buildPermutationDic start, buffer is " + buffer);

  if(buffer !== null && buffer.length < kMinWordLen) 
  {
    return null;
  }

  var start = 0;
  while(start < buffer.length-1) 
  {
    permutationDic[buffer[start]] = [];

    for(var minStart = 2; (start + minStart) <= buffer.length; ++minStart)
    {
      permutationDic[buffer[start]].push(buffer.substring(start, (start + minStart)));
    }
    start++;
  }        

  //Logger.log("dic is " + JSON.stringify(permutationDic));
  return permutationDic;
  
  //start = 0
  //minStart = 2

  //ABCDE
  /* 
    What the output should be.
    AB
    ABC
    ABCD
    ABCDE
    BC
    BCD
    BCDE
    CD
    CDE
    DE
  */
}

/**
 * Look at groupings of kanji and build a list of strings.
 */
function buildJapaneseWordDic(textStr) 
{
  var wordDic = {};
  var buffer = "";

  for(var i=0; i<textStr.length; ++i) 
  {
    var unicodeVal = textStr[i];

    //test if it's a kanji character
    if(isKanji(textStr.charCodeAt(i)))
    {
      buffer += unicodeVal;
    }
    else if(buffer.length >= kMinWordLen)
    {
      //handle different word permutations
      var permutationDic = buildPermutationDic(buffer);
      //Logger.log("permutationDic is " + JSON.stringify(permutationDic));
      if(permutationDic !== null) 
      {
        for(var key in permutationDic) 
        {
          var results = getJapaneseWords(key, permutationDic[key]);
          if(results != null && results.length > 0)
          {
            for(var resultIndex = 0; resultIndex < results.length; ++resultIndex) 
            {
              var result = results[resultIndex];
              if(wordDic[result.word])
              {
                wordDic[result.word].count += 1;
              }
              else
              {
                wordDic[result.word] = {
                  "wordInfo" : result, 
                  "count" : 1
                }
              }
            }
          }
        }        
      }

      /*
      //copy the word over
      var word = (' ' + buffer).slice(1);
      Logger.log("buffer is " + buffer + ", word is " + word);
      if(wordDic[word])
      {
        wordDic[word].count += 1;
      }
      else
      {
        wordDic[word] = {
          "wordInfo" : getJapaneseWordData(word),
          "count" : 1
        }
      }*/

      //clear the buffer ready for the next word.
      buffer = "";
    }
    else 
    {
      buffer = "";
    }
  }

  return wordDic;
}

//helper function to test if the letter is a valid kanji unicode
function isKanji(val) 
{
  return (val >= 0x4E00 && val <= 0x9FAF);
}

/**
 * Given a text string returns an array of all the unique kanji in a text string.
 * @param textStr Japanese text to process and build a kanji table from.
 * @customfunction
 */
function buildKanjiTable(textStr) 
{
  var output = [];
  output.push(["Kanji Table"]);
  output.push(["kanji", "konyomi", "onyomi", "grade", "definition", "count"]);

  var kanjiDic = buildKanjiTableData(textStr);  
  for(var key in kanjiDic) 
  {
    var kanjiInfo = kanjiDic[key].kanjiInfo;
  
    //add the kanji character to the front
    kanjiInfo.unshift(key);
    kanjiInfo.push(kanjiDic[key].count);
    output.push(kanjiInfo);
  }

  return output;
}

/**
 * Build the dictionary of unique kanji in the text
 */
function buildKanjiTableData(textStr) 
{
  var kanjiDic = {};

  // Kanji unicode: 	\u4E00-\u9FAF
  // Build unique set of kanji characters
  // character order is how it was found in the text.
  for(var i=0; i<textStr.length; ++i) 
  {
    var unicodeVal = textStr[i];

    //test if it's a kanji character
    if(isKanji(textStr.charCodeAt(i)))
    {
      //if we have this character, ignore it.
      if(kanjiDic[unicodeVal]) 
      {
        kanjiDic[unicodeVal].count += 1;
      }
      else 
      {
        kanjiDic[unicodeVal] = {
          kanjiInfo: getKanjiArray(unicodeVal),
          count: 1
        };
      }
    }
  }

  return kanjiDic;
}

/**
 * Given a text string returns an array of all the unique kanji based vocab words
 * @param textStr Japanese text to process and build a kanji table from.
 * @customfunction
 */
function buildJapaneseWordTable(textStr) 
{
  var output = [];
  output.push(["Vocabulary List"]);

  //get words made out of kanji and print them out.
  var wordDic = buildJapaneseWordDic(textStr)
  for(var key in wordDic)
  {
    var wordInfo = wordDic[key].wordInfo;

    if(wordInfo !== null) 
    {
      output.push([key, wordInfo.pronounced, "", "", wordInfo.meanings, wordDic[key].count]);
    }
    else 
    {
      output.push([key, "none", "", "", "no definition", 0]);
    }
  }

  return output;
}

/**
 * Build kanji and word tables -- but this can exceed the max allowed runtime for a goodgle spreadsheet.
 */
function BuildJapaneseWorksheet(textStr) 
{
  var output = [];

  var kanjiDic = buildKanjiTableData(textStr);  
  for(var key in kanjiDic) 
  {
    var kanjiInfo = kanjiDic[key].kanjiInfo;
    //add the kanji character to the front
    kanjiInfo.unshift(key);
    kanjiInfo.push(kanjiDic[key].count);
    output.push(kanjiInfo);
  }

  output.push([]);
  output.push(["Vocabulary List"]);

  //get words made out of kanji and print them out.
  var wordDic = buildJapaneseWordDic(textStr)
  for(var key in wordDic)
  {
    var wordInfo = wordDic[key].wordInfo;

    if(wordInfo !== null) 
    {
      output.push([key, wordInfo.pronounced, "", "", wordInfo.meanings, wordDic[key].count]);
    }
    else 
    {
      output.push([key, "none", "", "", "no definition", 0]);
    }
  }

  return output;
}
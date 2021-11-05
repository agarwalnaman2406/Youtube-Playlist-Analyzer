const puppeteer = require('puppeteer');
const pdf = require('pdfkit');
const fs = require('fs');

// let link = 'https://www.youtube.com/playlist?list=PLzkuLC6Yvumv_Rd5apfPRWEcjf9b1JRnq';
let link = 'https://www.youtube.com/playlist?list=PLRBp0Fe2GpgnIh0AiYKh7o7HnYAej-5ph';
let ctab;

(async function(){

    try {

        let browserOpen = puppeteer.launch({
            headless: false,
            defaultViewport: null,
            args: ["--start-maximized"],
        });

        let browserInstance = await browserOpen;
        let allTabsArr = await browserInstance.pages();
        ctab = allTabsArr[0];
        await ctab.goto(link);
        await ctab.waitForSelector('h1#title');
        let name = await ctab.evaluate(function(select){
            return document.querySelector(select).innerText
        },'h1#title');
        // console.log(name);

        let allData = await ctab.evaluate(getData, '#stats .style-scope.ytd-playlist-sidebar-primary-info-renderer');
        // console.log(name, allData.noOfVideos, allData.noOfViews);

        let totalVideos = allData.noOfVideos.split(" ")[0];
        // console.log(totalVideos);

        let currentVideos = await getCVideosLength();
        // console.log(currentVideos);

        while(totalVideos - currentVideos >= 20){
            await scrollToBottom();
            currentVideos = await getCVideosLength();
        }

        let finallst = await getStats();
        
        let totalLengthOfAllVid = totalLengthOfAllVideos(finallst);
        // console.log(finallst.length);

        let obj =  {"Total Length of all videos": totalLengthOfAllVid + " seconds",
                    "Total Videos": finallst.length};
        finallst.push(obj);
        // console.log(obj);
        let pdfDoc = new pdf;
        pdfDoc.pipe(fs.createWriteStream('play.pdf'));
        pdfDoc.text(JSON.stringify(finallst));
        pdfDoc.end();
    } catch (error) {
        
    }


})()

function getData(selector){

    let allElems = document.querySelectorAll(selector);
    let noOfVideos = allElems[0].innerText;
    let noOfViews = allElems[1].innerText;

    return{
        noOfVideos,
        noOfViews
    }

}

async function getStats(){
    let list = ctab.evaluate(getNameandDuration, '#video-title', '#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
    return list;
}

async function getCVideosLength(){
    let length = await ctab.evaluate(getLength, '#container>#thumbnail span.style-scope.ytd-thumbnail-overlay-time-status-renderer');
    return length;
}

function getLength(durationSelect){

    let durationElem = document.querySelectorAll(durationSelect);
    return durationElem.length;

}

async function scrollToBottom(){

    await ctab.evaluate(gotoBottom);
    function gotoBottom(){
        window.scrollBy(0, window.innerHeight);
    }

}

function getNameandDuration(videoSelector, durationSelector){

    let videoElem = document.querySelectorAll(videoSelector);
    let durattionElement = document.querySelectorAll(durationSelector);

    let currentList = [];

    for(let i=0;i<durattionElement.length;i++){

        let videoTitle = videoElem[i].innerText;
        let duration = durattionElement[i].innerText;
        currentList.push({videoTitle, duration});

    }

    return currentList;

}

function totalLengthOfAllVideos(list) {
    let l = 0;
    for (let i = 0; i < list.length; i++) {
        let x = list[i].duration;
        let y = x.split(":");
        let a = (Number)(y[0].trim());
        let b = (Number)(y[1].trim());
        l += a * 60 + b;
    }
    return l;
}
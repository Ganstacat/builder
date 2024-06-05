export function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

export function httpPost(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", theUrl); // false for synchronous request
    // xmlHttp.setRequestHeader('Content-type', 'application/json');
    xmlHttp.setRequestHeader('Content-type', 'application/x-www-form-urlencoded');
    xmlHttp.onload = () =>{
        console.log(xmlHttp.responseText);
    }
    xmlHttp.send('fname=Mary');
    return xmlHttp.responseText;
}
export function setCookie(cname, cvalue, exdays) {
    const d = new Date();
    d.setTime(d.getTime() + (exdays * 24 * 60 * 60 * 1000));
    let expires = "expires=" + d.toUTCString();
    document.cookie = cname + "=" + cvalue + ";" + expires + ";path=/";
}
export function deleteCookie(cname){
    document.cookie = `${cname}=; expires=Thu, 01 Jan 1970 00:00:00 UTC; path=/;`;
}
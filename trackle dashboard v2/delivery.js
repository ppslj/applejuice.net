const apiurl = "http://3.128.197.185";

function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", apiurl + theUrl, false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

function loadDelviery(){
    const urlParams = new URLSearchParams(window.location.search);
    const myParam = urlParams.get('key');

    var response = JSON.parse(httpGet("/api/deliveryrecord?key=" + myParam));

    //not found
    if(response['CODE'] != null){
    }
    //found
    else{
        document.getElementById("CUSTOMER_PO_HERE").innerText = response['CUSTOMERPO'];
        document.getElementById("PPS_JOB_NUMBER").innerText = response['JOBNUM'];
        document.getElementById("FORM_NUMBER").innerText = response['FORMNUMBER'];

        document.getElementById("CUSTOMER_NAME_HERE").innerText = response['COMPANY'];
        document.getElementById("CUSTOMER_ADDRESS_HERE").innerText = response['NAMEADDR'];

        document.getElementById("BOX_NUM_HERE").innerText = response['NUM_BOXES'];
        document.getElementById("BOX_TYPE_HERE").innerText = response['TYPE'];
        document.getElementById("PRODUCT_DESCRIPTION").innerText = response['PRODUCTDESCRIPTION'];

        document.getElementById("NOTES_HERE").innerText = response['OTHERDATA'];

        document.getElementById("DELIVERY_DATE_HERE").innerText = response['DATETIME'];
        document.getElementById("DELIVERY_TIME_HERE").innerText = response['DATETIME'];
        document.getElementById("DESCRIPTION_HERE").innerText = response['DESCRIPTION'];

        document.getElementById("SIGN_NAME_HERE").innerText = response['SIGNER'];

        document.getElementById("image").src = apiurl + "/api/img?q=" + response['IMAGEURL'];

    }
}

window.addEventListener("load", (event) => {
    loadDelviery();
});
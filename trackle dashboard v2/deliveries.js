const apiurl = "http://3.128.197.1851";

function httpGetWithAuth(theUrl, bearer)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", encodeURI(theUrl), false ); // false for synchronous request
    xmlHttp.setRequestHeader("Authorization", bearer);
    xmlHttp.send( null );
    return xmlHttp.responseText;
}

function loadDeliveries(){
    document.getElementById("deliveriesListing").innerHTML = "";

    var response = JSON.parse(httpGetWithAuth(apiurl + "/api/deliveries", localStorage.getItem("token")));

    const prefab = '<div class="prefab">' +
                    '<h6 class="eb1"># BOXES</h6>' +
                    '<h2 class="eb2">P/U</h2>' +
                    '<h6 class="eb3">COMPANY</h6>' +
                    '<h6 class="eb5"></h6>' +
                    '<h6 class="eb7">JOB #</h6>' +
                    '<br>' +
                    '<h6 class="eb1">PCKG TYPE</h6>' +
                    '<h6 class="eb3">NAME/ADDR</h6>' +
                    '<h6 class="eb5">NOTES HERE</h6>' +
                    '<h6 class="eb7">PO #</h6>' +
                    '</div>';

    //not found
    if(response['CODE'] != null){
        window.location.replace("./index.html");
    }
    //found
    else{
        for(var i = 0; i < response['DELIVERIES'].length; i++){
            var x = response['DELIVERIES'][i];
            
            var listing = prefab;

            if(x['PU'] == "YES"){
                listing = listing.replace("P/U", "X");
            }
            else{
                listing = listing.replace("P/U", "");
            }

            listing = listing.replace("# BOXES", "<b>" + x['NUM_BOXES'] + "</b>");
            listing = listing.replace("COMPANY",  "<b>" + x['COMPANY'] + "</b>");
            listing = listing.replace("JOB #",  "JOB#: &nbsp;&nbsp;&nbsp;<b>" + x['JOBNUM'] + "</b>");
            listing = listing.replace("PCKG TYPE",  x['TYPE']);
            listing = listing.replace("NAME/ADDR",  "&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;"+ x['NAMEADDR']);
            listing = listing.replace("NOTES HERE",  x['OTHERDATA']);
            listing = listing.replace("PO #",  "PO: &nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;<b>" + x['CUSTOMERPO'] + "</b>");

            //creating new lines
            if(i == 17){
                listing += "<br><br<br>";
            }

            document.getElementById("deliveriesListing").innerHTML += listing
        }

        //creating empty space
        for(var i = 0; i < 18 - response['DELIVERIES'].length; i++){
            document.getElementById("deliveriesListing").innerHTML += "<div class='prefab'> </div>";
        }

        document.getElementById("dateToday").innerHTML = response['DATE'];
        document.getElementById("totalDeliveries").innerHTML = "Total:   " + response['DELIVERIES'].length;

        window.print();
    }
}

window.addEventListener("load", (event) => {
    loadDeliveries();
});

window.addEventListener("afterprint", (event) =>{
    document.body.innerHTML = "<center style='color: white;'><br><br><br><br><br>You may now close this window.</center>";
    window.close();
});
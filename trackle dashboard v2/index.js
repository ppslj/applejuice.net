//http://127.0.0.1
//http://18.118.32.248
const apiurl = "http://3.128.197.185";
var loggingIn = false;
var localStorage = window.localStorage;
var customers = [];

function httpGet(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", encodeURI(theUrl), false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}
function httpGetWithAuth(theUrl, bearer)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "GET", encodeURI(theUrl), false ); // false for synchronous request
    xmlHttp.setRequestHeader("Authorization", bearer);
    xmlHttp.send( null );
    return xmlHttp.responseText;
}
function httpPost(theUrl)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", encodeURI(theUrl), false ); // false for synchronous request
    xmlHttp.send( null );
    return xmlHttp.responseText;
}
function httpPostWithAuth(theUrl, bearer)
{
    var xmlHttp = new XMLHttpRequest();
    xmlHttp.open( "POST", encodeURI(theUrl), false ); // false for synchronous request
    xmlHttp.setRequestHeader("Authorization", bearer);
    xmlHttp.send( null );
    return xmlHttp.responseText;
}
function hash(string) {
    const utf8 = new TextEncoder().encode(string);
    return crypto.subtle.digest('SHA-256', utf8).then((hashBuffer) => {
      const hashArray = Array.from(new Uint8Array(hashBuffer));
      const hashHex = hashArray
        .map((bytes) => bytes.toString(16).padStart(2, '0'))
        .join('');
      return hashHex;
    });
}
///
//      index.html functions
///

//easy alert function
function error(message){
    alert("error: " + message);
}

//sign in button
function login(){
    //preventing more than 1 request being sent
    if(loggingIn){
        return;
    }
    loggingIn = true;
    document.getElementById("loginError").textContent = "logging in...";


    //getting variables
    const username = document.getElementById("username").value;
    const password = document.getElementById("password").value;

    hash(password).then((value) => {
        //sending request
        var response = JSON.parse(httpPost(apiurl + "/login?u=" + username + "&p=" + value));

        //checking for errors response["CODE"] != 200
        if(response["TOKEN"] == null){
            document.getElementById("loginError").textContent = response["MESSAGE"];
            loggingIn = false;
        }
        else{
            //extract token and save to cache
            //error(response["TOKEN"]["TOKEN"]);
            document.getElementById("loginError").textContent = "loading...";
            //saving the token
            localStorage.setItem("token", response["TOKEN"]["TOKEN"]);
            localStorage.setItem("username", response["USERNAME"]);
            localStorage.setItem("permissions", response["PERMISSIONS"]);


            console.log(response["TOKEN"]['TOKEN']);
            console.log(localStorage.getItem("token"));

            //going to dashboard
            window.location.replace("./dashboard.html");
        }
    });
}

//validates the login cookie, also checks for what page the window is on
function loadLoginCookie(){
    var cookie = localStorage.getItem("token");
    var currentPage = window.location.pathname.split("/")[window.location.pathname.split("/").length-1];

    //going to login if there is no cookie in saved data
    if(currentPage == "dashboard.html" && cookie == null || currentPage == "dashboard.html" && cookie == ""){
        window.location.replace("./index.html");
        return;
    }

    //going to dashboard if the cookie is not equal to null and the token is validated
    if(cookie != null && currentPage == "index.html" || cookie != "" && currentPage == "index.html"){
        document.getElementById("username").value = localStorage.getItem("username");

        //checking token
        var valid = checkLoginToken(cookie);
        if(valid[0] == true){
            window.location.replace("./dashboard.html");
        }
        else{
            localStorage.setItem("token", "");
        }
    }
    //if cookie not null and page is dashboard, verifying token
    else if (cookie != null && currentPage == "dashboard.html" || cookie != "" && currentPage == "dashboard.html"){
        //checking token
        var valid = checkLoginToken(cookie);
        if(valid[0] == false){
            localStorage.setItem("token", "");
            window.location.replace("./index.html");
        }
    }
    else{
        document.getElementById("username").innerHTML = localStorage.getItem("username");
    }
}

//sends post request to server
function checkLoginToken(token){
    var response = JSON.parse(httpPostWithAuth(apiurl + "/api/token", token));

    if(response["CODE"] == 200){
        return [true, response['MESSAGE']];
    }
    else{
        return [false, 0];
    }
}

function help(){

}


///
//      dashboard.html functions
///

//self explanatory
function createEmployee(){
    const username = encodeURIComponent(document.getElementById("addusername").value);
    const permissions = encodeURIComponent(document.getElementById("addpermissions").value);
    const otherdata = encodeURIComponent(document.getElementById("addother").value);

    //regulating paramaters
    if(username == ""){
        alert("Username cannot be empty"); return;
    }
    //regulating what kind of values are entered into permissions
    else{
        //testing if the value is an integer
        try{
            var p = parseInt(permissions.toString());
            if(p > 5){   alert("Permissions # MUST be betwen 1-5 (1)"); return;     }
            else if(p < 1){     alert("Permissions # MUST be betwen 1-5 (2)"); return;  }
            else if(p.toString() == "NaN"){
                alert("Permissions # MUST be betwen 1-5 (2)"); return;
            }
        }
        catch (ex){
            console.log(ex);
            alert("Permissions # MUST be betwen 1-5 (3)"); return;
        }
    }

    var response = JSON.parse(httpPostWithAuth(apiurl + "/api/createuser?u=" + username + "&p=" + permissions + "&o=" + otherdata, localStorage.getItem("token")));

    //checking for errors
    if(response['CODE'] == 400){
        error(response['MESSAGE']);
    }
    else{
        //clearing fields
        document.getElementById("addusername").value = "";
        document.getElementById("addpermissions").value = "";
        document.getElementById("addother").value = "";

        loadEmployees();
    }
}

function loadEmployees(){
    var response = JSON.parse(httpGetWithAuth(apiurl + "/api/users", localStorage.getItem("token")));

    //clearing div
    document.getElementById("employeeListing").innerHTML = "";

    const prefab = "<div class=\"employeeBlock\">"
        + "<h5 style=\"float: left; position: absolute; margin-top: 0.5%;\"><image class=\"button-logo\" src=\"./images/logos/user.png\"></image>&nbsp;&nbsp;&nbsp;USERNAME</h5>"
        + "<h5 style=\"float: left; position: absolute; margin-left: 25%; margin-top: 0.5%;\">PERMISSIONS</h5>"
        + "<h5 style=\"float: left; position: absolute; margin-left: 45%; margin-top: 0.5%;\">OTHERDATA</h5>"
        + "<h5 onclick=\"deleteUser('DELETE_NAME');\" style=\"cursor:CURSOR_POINTER; color: #C70000; float: right; position: absolute; margin-left: 70%; margin-top: 0.5%;\">Delete User</h5></div>";

    //successful
    if(response['CODE'] == null){

        //going through each employee
        for(var i = 0; i < response['EMPLOYEES'].length; i++){
            var x = response['EMPLOYEES'][i];
            
            var listing = prefab.replace("USERNAME", x['USERNAME']);
            listing = listing.replace("PERMISSIONS", x['PERMISSIONS'] + "&nbsp;&nbsp;" + getPermissionName(x['PERMISSIONS']));
            listing = listing.replace("OTHERDATA", x['OTHERDATA']);
            listing = listing.replace("DELETE_NAME", x['PERMISSIONS'] >= 5 ? "not-allowed" : x['USERNAME']);

            //making it so you can't delete admins
            listing = listing.replace("CURSOR_POINTER", x['PERMISSIONS'] >= 5 ? "not-allowed" : "pointer");

            //adding it to the div
            document.getElementById("employeeListing").innerHTML += listing
        }
    }
    else{
        error(response['MESSAGE']);
    }
}

function deleteUser(username){
    if(username == 'not-allowed'){
        return;
    }

    var response = JSON.parse(httpPostWithAuth(apiurl + "/api/deleteuser?u=" + encodeURIComponent(username), localStorage.getItem("token")));

    if(response['CODE'] == 200){
        //done
        loadEmployees();
    }
    else{
        error(response['MESSAGE']);
    }
}

function loadDeliveries(){
    var response = JSON.parse(httpGetWithAuth(apiurl + "/api/deliveries", localStorage.getItem("token")));
    var perms = parseInt(localStorage.getItem("permissions"));

    //clearing div
    document.getElementById("deliveriesListing").innerHTML = "";

    const prefab = "<div class='delivery-block'>" +
            "<h5 class='eb1 print-size-change'><b># OF BOXES</b></h5>" +
            "<h1 class='eb2 print-size-change'>P/U</h1>" +
            "<h5 class='eb3 print-size-change'><b>COMPANY</b></h5>" +
            "<h5 class='eb7 print-size-change'>JOB#: <b>JOB #</b></h5>" +
            "<br>" +
            "<h5 class='eb1 print-size-change'>TYPE</h5>" +
            "<h5 class='eb3 print-size-change'>&nbsp;&nbsp;&nbsp;&nbsp;&nbsp;NAME/ADDRESS</h5>" +
            "<h5 class='eb5 print-size-change'>OTHERDATA</h5>" +
            "<h5 class='eb7 print-size-change'>PO: <b>PO #</b></h5>" +
            "<h6 class='eb8' style='cursor:pointer; color: #C70000; display: DISPLAY_HERE;' onclick=\"deleteDelivery('KEY_HERE');\">X</h6>" +
        "</div>";
    //successful
    if(response['CODE'] == null){

        //going through each employee
        for(var i = 0; i < response['DELIVERIES'].length; i++){
            var x = response['DELIVERIES'][i];
            
            var listing = prefab.replace("# OF BOXES", x['NUM_BOXES']);
            listing = listing.replace("TYPE", x['TYPE']);
            listing = listing.replace("P/U", x['PU'] == "YES" ? "X" :"");
            listing = listing.replace("COMPANY", x['COMPANY']);
            listing = listing.replace("NAME/ADDRESS", x['NAMEADDR']);
            listing = listing.replace("OTHERDATA", x['OTHERDATA']);
            listing = listing.replace("JOB #", x['JOBNUM']);
            listing = listing.replace("PO #", x['CUSTOMERPO']);
            listing = listing.replace("KEY_HERE", x['TEMPKEY']);

            if(perms < 2){
                listing = listing.replace("DISPLAY_HERE", "none;");
            }
            else{
                listing = listing.replace("DISPLAY_HERE", "block;");
            }

            //making it so you can't delete admins
            listing = listing.replace("CURSOR_POINTER", x['PERMISSIONS'] == 5 ? "not-allowed" : "pointer");

            //adding it to the div
            document.getElementById("deliveriesListing").innerHTML += listing
        }
    }
    else{
        error(response['MESSAGE']);
    }
}
function deleteDelivery(key){
    if(key == 'not-allowed'){
        return;
    }

    var response = JSON.parse(httpPostWithAuth(apiurl + "/api/deletedelivery?k=" + encodeURIComponent(key), localStorage.getItem("token")));

    if(response['CODE'] == 200){
        //done
        loadDeliveries();
    }
    else{
        error(response['MESSAGE']);
    }
}

function createDelivery(){
    const boxes = encodeURIComponent(document.getElementById("numBoxes").value);
    const type = encodeURIComponent(document.querySelector('input[name="type"]:checked').value);
    const pu = encodeURIComponent(document.querySelector('input[name="pU"]:checked').value);
    const company = encodeURIComponent(document.getElementById("company").value);
    const nameaddr = encodeURIComponent(document.getElementById("nameAddr").value);
    const otherdata = encodeURIComponent(document.getElementById("other").value);
    const jobnum = encodeURIComponent(document.getElementById("jobNum").value);
    const customerpo = encodeURIComponent(document.getElementById("customerpo").value);
    const formnumber = encodeURIComponent(document.getElementById("formnumber").value);
    const customeremail = encodeURIComponent(document.getElementById("customeremail").value);
    const emailsettings = encodeURIComponent(document.querySelector('input[name="esetting"]:checked').value);
    const productdescription = encodeURIComponent(document.getElementById("productdescription").value);

    //sending request
    var response = JSON.parse(httpPostWithAuth(apiurl + "/api/createdelivery?b=" +
        boxes +"&t=" +
        type + "&p=" +
        pu + "&c=" +
        company + "&n=" + 
        nameaddr + "&od=" +
        otherdata + "&job=" + 
        jobnum + "&cpo=" +
        customerpo + "&fnum=" + 
        formnumber + "&cmail=" + 
        customeremail + "&eset=" + 
        emailsettings + "&pdesc=" + productdescription
        , localStorage.getItem("token")));
    
    if(response['CODE'] != 200){
        error(response['MESSAGE']);
    }
    //result successfully
    else{
        //clearing fields
        document.getElementById("numBoxes").value = "1";
        //document.getElementById("type").value = "";
        //document.getElementById("pU").value = "NO";
        document.getElementById("company").value = "";
        document.getElementById("nameAddr").value = "-";
        document.getElementById("other").value = "-";
        document.getElementById("jobNum").value = "-";
        document.getElementById("customerpo").value = "-";
        document.getElementById("formnumber").value = "";
        document.getElementById("productdescription").value = "-";
        document.getElementById("customeremail").value = "";

        dashboard("deliveries-panel");
    }
}
function clearDeliveries(){
    var response = JSON.parse(httpPostWithAuth(apiurl + "/api/clear", localStorage.getItem("token")));

    //successful
    if(response['CODE'] == 200){
        dashboard('deliveries-panel');
    }
    else{
        error(response['MESSAGE']);
    }
}
function loadAppLogs(){
    var response = JSON.parse(httpGetWithAuth(apiurl + "/api/app/logs", localStorage.getItem("token")));

    //clearing div
    document.getElementById("appListing").innerHTML = "";

    const prefab = "<div class='app-block BLOCK_TYPE'>" +
                        "<h3 class='eb1'>DATE</h3>" +
                        "<h3 class='eb2'>USER</h3>" +
                        "<h4 class='eb4'>MESSAGE</h4>" +
                        "<h4 class='eb6'>OTHERDATA</h4>" +
                "</div>";
    //successful
    if(response['CODE'] == null){

        //going through each employee
        for(var i = response['LOGS'].length -1; i >= 0; i--){
            var x = response['LOGS'][i];
            
            var listing = prefab.replace("# OF BOXES", x['NUM_BOXES']);
            listing = listing.replace("DATE", x['DATE']);
            listing = listing.replace("USER", x['USER']);
            listing = listing.replace("MESSAGE", x['DATA']);
            listing = listing.replace("OTHERDATA", x['OTHERDATA']);

            //log-block-normal
            //log-block-error
            //log-block-green
            var block = 'log-block-normal';
            if(x['USER'] == 'trackle.app'){
                block = 'log-block-normal'
            }
            else if (x['USER'] == 'trackle.error'){
                block = 'log-block-error'
            }
            else if(x['USER'] == 'trackle.update'){
                block = 'log-block-green'
            }

            listing = listing.replace("BLOCK_TYPE", block);

            //adding it to the div
            document.getElementById("appListing").innerHTML += listing
        }
    }
    else{
        error(response['MESSAGE']);
    }
}
function clearTable(q){
    var response = JSON.parse(httpPostWithAuth(apiurl + "/api/cleartable?q=" + q, localStorage.getItem("token")));

    //successful
    if(response['CODE'] == 200){
        dashboard('app-log-panel');
    }
    else{
        error(response['MESSAGE']);
    }
}
function loadRecords(query){
    var data = '';
    //customer search
    if(query == '0'){
        data = document.getElementById("customerName").value;
    }
    else if(query == '1'){
        data = document.getElementById("deliveryDate").value;
    }
    else if(query == '2'){
        data = document.getElementById("jobNumber").value;
    }

    //preventing a butt load of data being thrown at the user
    if(data == '' || data == ' '){
        query = '5';
    }

    //url encoding
    data = encodeURIComponent(data);
    query = encodeURIComponent(query);

    //sending request
    var response = JSON.parse(httpGetWithAuth(apiurl + "/api/records?q=" + query + "&data=" + data, localStorage.getItem("token")));

    //clearing records // div
    document.getElementById("deliveryRecords").innerHTML = "";

    const prefab = "<div class='delivery-record'>" +
                        "<div class='eb1'>COMPANY</div>" +
                        "<div class='eb2'></div>" +
                        "<div class='eb4'>DELIVERY DATE</div>" +
                        "<div class='eb5'>NOTES</div>" +
                        "<div class='eb6'>JOB #</div>" +
                        "<div class='holder' style='float: right; width: 10%; margin-top: -0.75%; margin-right: 0.75%'>" +
                            "<button class='btn' onclick='window.open(\"./delivery.html?key=UNIQUEKEYHERE\");'>View Receipt</button>" +
                        "</div>" +
                    "</div>";

    //successful
    if(response['CODE'] == null){

        //going through each employee
        for(var i = response['RECORDS'].length -1; i >= 0 ; i--){
            var x = response['RECORDS'][i];
            
            var listing = prefab.replace("COMPANY", x['COMPANY']);
            listing = listing.replace("DELIVERY DATE", x['DATETIME']);
            listing = listing.replace("NOTES", x['DESCRIPTION']);
            listing = listing.replace("JOB #", x['JOBNUM']);
            listing = listing.replace("NOTES", x['DESCRIPTION']);
            listing = listing.replace("UNIQUEKEYHERE", x['UNIQUEKEY']);

            //adding it to the div
            document.getElementById("deliveryRecords").innerHTML += listing
        }
    }
    else{
        error(response['MESSAGE']);
    }
}
function loadCustomers(){
    customers = [];
    var response = JSON.parse(httpGetWithAuth(apiurl + "/api/customers", localStorage.getItem("token")));

    document.getElementById("customers-listing").innerHTML = "";

    const prefab = "<div class='company-block' onclick='clickedCustomer(\"COMPANY_NAME1\");'>" +
                            "<div class='fnt-size3' style='float:left;'>COMPANY_NAME2</div>" +
                            "<div class='fnt-size3' style='float:right;'>ADDRESS</div>" + 
                            "<br><div class='fnt-size3' style='float:left;'>EMAIL_ADDR</div>" +
                        "</div>";

    if(response['CODE'] == null){
        for(var i = 0; i < response['CUSTOMERS'].length; i++){
            var customer = response['CUSTOMERS'][i];

            customers.push(customer);
            
            var item = prefab.replace("COMPANY_NAME1", customer['NAME']);
            item = item.replace("COMPANY_NAME2", customer['NAME']);
            item = item.replace("ADDRESS", customer['ADDR']);
            item = item.replace("EMAIL_ADDR", customer['RECEIPT']);


            document.getElementById("customers-listing").innerHTML += item;
        }
    }
}
function clickedCustomer(name){
    for(var i = 0; i < customers.length; i++){
        var customer = customers[i];

        if(customer['NAME'] == name){
            document.getElementById("company").value = customer['NAME'];
            document.getElementById("nameAddr").value = customer['ADDR']
            document.getElementById("customeremail").value = customer['RECEIPT']
            break;
        }
    }
}
function loadDashboardData(){
    document.getElementById("dashboardDeliveries").innerHTML = "";
    var response = JSON.parse(httpGetWithAuth(apiurl + "/api/dashboard", localStorage.getItem("token")));

    if(response['CODE'] != null){
        error(response['MESSAGE']);
    }
    else{
        document.getElementById("deliveriesToday").innerText = response["DELIVERIES_TODAY"];
        document.getElementById("dateToday").innerText = response["TODAY"];

        document.getElementById("deliveriesYesterday").innerText = response["DELIVERIES_YESTERDAY"];
        document.getElementById("dateYesterday").innerText = response["YESTERDAY"];

        //for each loop
        for(var i = 0; i < response['DELIVERIES'].length; i++){
            var el = response['DELIVERIES'][i];

            document.getElementById("dashboardDeliveries").innerHTML += "<div class=\"fnt-size3\">" + el['COMPANY'] + "</div>";
        }
    }
}

function loadSettings(){
    //loading customers
    document.getElementById("customersSettingsListing").innerHTML = "";
    document.getElementById("settingsEmailListing").innerHTML = "";

    var response = JSON.parse(httpGetWithAuth(apiurl + "/api/customers", localStorage.getItem("token")));

    if(response['CODE'] != null){
        error(response['MESSAGE']);
    }
    else{
        const prefab = "<div class='company-block' style='height: 10%; cursor: not-allowed;'>" +
                            "<div class='fnt-size3' style='float:left;'>COMPANY_NAME</div>" +
                            "<div class='fnt-size3' style='float:right;'>ADDRESS</div>" + 
                            "<br>" + 
                            "<div class='fnt-size3' style='float:left;'>EMAIL_HERE</div>" +
                            "<div class='fnt-size3' onclick=\"deleteCustomerPreset('KEY_HERE');\" style=\"cursor:pointer; color: #C70000; float: right;\">Delete Preset</div>";
                        "</div>";

        for(var i = 0; i < response['CUSTOMERS'].length; i++){
            var x = response['CUSTOMERS'][i];

            var listing = prefab;
            listing = listing.replace("COMPANY_NAME", x['NAME']);
            listing = listing.replace("ADDRESS", x['ADDR']);
            listing = listing.replace("EMAIL_HERE", x['RECEIPT']);

            //for deleting
            listing = listing.replace("KEY_HERE", x['UNIQUEKEY']);


            
            document.getElementById("customersSettingsListing").innerHTML += listing; //"<div class=\"fnt-size3\">" + x['NAME'] + "</div>";
        }
    }

    //loading delivery receipt recipients
    var response = JSON.parse(httpGetWithAuth(apiurl + "/api/settings/emails", localStorage.getItem("token")));

    if(response['CODE'] != null){
        error(response['MESSAGE']);
    }
    else{
        const prefab = "<div class='company-block' style='height: 10%; cursor: not-allowed;'>" +
                            "<div class='fnt-size3' style='float:left;'>EMAIL_HERE</div>" +
                            "<div class='fnt-size3' style='float:right;'>OTHER_DATA</div>" + 
                            "<br>" + 
                            "<div class='fnt-size3' style='float:left;'>NAME_HERE</div>" +
                            "<div class='fnt-size3' onclick=\"deleteEmailPreset('KEY_HERE');\" style=\"cursor:pointer; color: #C70000; float: right;\">Delete</div>";
                        "</div>";

        for(var i = 0; i < response['RECIPIENTS'].length; i++){
            var x = response['RECIPIENTS'][i];

            var listing = prefab;
            listing = listing.replace("EMAIL_HERE", x['EMAIL']);
            listing = listing.replace("OTHER_DATA", x['OTHER']);
            listing = listing.replace("NAME_HERE", x['NAME']);

            //for deleting
            listing = listing.replace("KEY_HERE", x['UNIQUEKEY']);


            
            document.getElementById("settingsEmailListing").innerHTML += listing; //"<div class=\"fnt-size3\">" + x['NAME'] + "</div>";
        }
    }
}
function createCustomerPreset(){
    const name = encodeURIComponent(document.getElementById("settingsCustomerName").value);
    const addr = encodeURIComponent(document.getElementById("settingsCustomerAddr").value);
    const receipt = encodeURIComponent(document.getElementById("settingsCustomerReceipt").value);

    //regulating paramaters
    if(name == ""){
        alert("Name cannot be empty"); return;
    }

    var response = JSON.parse(httpPostWithAuth(apiurl + "/api/createcustomer?u=" + name + "&p=" + addr + "&o=" + receipt, localStorage.getItem("token")));

    //checking for errors
    if(response['CODE'] == 400){
        error(response['MESSAGE']);
    }
    else{
        //clearing fields
        document.getElementById("settingsCustomerName").value = "";
        document.getElementById("settingsCustomerAddr").value = "";
        document.getElementById("settingsCustomerReceipt").value = "";

        loadSettings();
    }
}
function deleteCustomerPreset(key){
    var response = JSON.parse(httpPostWithAuth(apiurl + "/api/deletecustomer?u=" + encodeURIComponent(key), localStorage.getItem("token")));

    //checking for errors
    if(response['CODE'] == 400){
        error(response['MESSAGE']);
    }
    else{
        //clearing fields
        loadSettings();
    }
}
function createEmailPreset(){
    const email = encodeURIComponent(document.getElementById("settingsEmailEmail").value);
    const name = encodeURIComponent(document.getElementById("settingsEmailName").value);
    const other = encodeURIComponent(document.getElementById("settingsEmailOther").value);

    //regulating paramaters
    if(email == ""){
        alert("Email cannot be empty"); return;
    }
    if(name == ""){
        alert("Name cannot be empty"); return;
    }

    var response = JSON.parse(httpPostWithAuth(apiurl + "/api/settings/cemail?e=" + email + "&n=" + name + "&o=" + other, localStorage.getItem("token")));

    //checking for errors
    if(response['CODE'] == 400){
        error(response['MESSAGE']);
    }
    else{
        //clearing fields
        document.getElementById("settingsEmailEmail").value = "";
        document.getElementById("settingsEmailName").value = "";
        document.getElementById("settingsEmailOther").value = "";

        loadSettings();
    }
}
function deleteEmailPreset(key){
    var response = JSON.parse(httpPostWithAuth(apiurl + "/api/settings/demail?u=" + encodeURIComponent(key), localStorage.getItem("token")));

    //checking for errors
    if(response['CODE'] == 400){
        error(response['MESSAGE']);
    }
    else{
        //clearing fields
        loadSettings();
    }
}
function mailPage(){
    document.getElementById("unapprovedMailListing").innerHTML = "";

    //Load unapproved and approved mail
    var response = JSON.parse(httpGetWithAuth(apiurl + "/api/pending/emails", localStorage.getItem("token")));

    if(response['CODE'] != null){
        error(response['MESSAGE']);
    }
    else{
        const prefab = "<div class='email-block'>" +
                            "<!--left-->" +
                            "<div class=holder' style='width: 50%; float: left;'>" +
                                "<div class=fnt-size3><b>COMPANY_NAME</b></div>" +
                                "<div class=fnt-size3'>Park Printing Job #: <b>JOBNUM</b></div>" +
                                "<div class=fnt-size3'>Customer PO: <b>CUSTOMERPO</b></div>" +
                            "</div>" +
                            "<!--right-->" +
                            "<div class='holder' style='width: 40%; float: right;'>" +
                                "<button class='btn' onclick=\"dashboard('mail-confirm-page'); viewUnconfirmedDelivery('KEY_HERE');\">Go to Confirmation Page</button>" +
                            "</div>" +
                        "</div>";

        for(var i = 0; i < response['PENDING'].length; i++){
            var x = response['PENDING'][i];

            var listing = prefab;
            listing = listing.replace("COMPANY_NAME", x['COMPANY']);
            listing = listing.replace("JOBNUM", x['JOBNUM']);
            listing = listing.replace("CUSTOMERPO", x['CUSTOMERPO']);

            //for deleting
            listing = listing.replace("KEY_HERE", x['UNIQUEKEY']);
            
            document.getElementById("unapprovedMailListing").innerHTML += listing; //"<div class=\"fnt-size3\">" + x['NAME'] + "</div>";
        }
    }
}
function viewUnconfirmedDelivery(key){
    var response = JSON.parse(httpGet(apiurl + "/api/deliveryrecord?key=" + key));

    //not found
    if(response['CODE'] != null){
        error(response['MESSAGE']);
    }
    //found
    else{
        var iframe = "<iframe class='delivery-receipt-preview' src='./delivery.html?key=" + key + "'>";
        document.getElementById("confirmReceiptData").innerHTML = iframe;
        document.getElementById("upcustomeremail").value = response['CUSTOMEREMAIL'];

        //configuring the buttons
        document.getElementById("send-email-casing").innerHTML = '<button onclick=\'sendEmailReceipt("' + key + '");\'class="approve-button btn" style="height: 40%;"><div class="fnt-size2">Send Receipt</div></button>';
        document.getElementById("del-email-casing").innerHTML = '<button onclick=\'deletePendingEmail("' + key + '");\'class="deny-button btn" style="height: 40%;"><div class="fnt-size2">Delete</div></button>';
    }
}
function sendEmailReceipt(key){
    const email = encodeURIComponent(document.getElementById("upcustomeremail").value);
    const setting = encodeURIComponent(document.querySelector('input[name="upesetting"]:checked').value);

    var response = JSON.parse(httpPostWithAuth(apiurl + "/api/sendreceipt?ke=" + encodeURIComponent(key) + "&ema=" + email + "&set=" + setting, localStorage.getItem("token")));

    if(response['CODE'] != 200){
        error(response['MESSAGE']);
    }
    else{
        dashboard('mail-panel');
    }
}
function deletePendingEmail(key){
    var response = JSON.parse(httpPostWithAuth(apiurl + "/api/delreceipt?ke=" + encodeURIComponent(key), localStorage.getItem("token")));

    if(response['CODE'] != 200){
        error(response['MESSAGE']);
    }
    else{
        dashboard('mail-panel');
    }
}

//enables/disables each page that is on the dashboard, page is in reference to each div
function dashboard(page){
    var panelClasses = ['dashboard-panel', 'deliveries-panel', 'create-delivery-panel', 'records-panel', 'employees-panel', 'email-records-panel', 'app-log-panel', 'mail-panel', 'mail-confirm-page'];

    //going through each panel and turning everything off except "page"
    for(var i = 0; i < panelClasses.length; i++){
        var x = panelClasses[i];
        var display = page==x ? 'inline' : 'none';
        
        var elements = document.getElementsByClassName(x);
        for(var b = 0; b < elements.length; b++){
            if(elements[b].nodeName == "center"){
                elements[b].style.display = display == "inline-block" ? "inline" : "none";
            }
            else{
                elements[b].style.display = display;
            }
        }
    }

    //more of custom data
    if(page == "employees-panel"){
        loadEmployees();
    }
    else if (page == "deliveries-panel"){
        loadDeliveries();
    }
    else if(page == "create-delivery-panel"){
        loadCustomers();
    }
    else if(page == "app-log-panel"){
        loadAppLogs();
    }
    else if (page == "records-panel"){
        loadRecords('5');
    }
    else if(page == "dashboard-panel"){
        loadDashboardData();
    }
    //more of a settings panel now
    else if(page =="email-records-panel"){
        loadSettings();
    }
    else if(page == "mail-panel"){
        mailPage();
    }
}

//checks which function to run after the cookie was loaded
function windowLoaded(){
    var currentPage = window.location.pathname.split("/")[window.location.pathname.split("/").length-1];

    //checking if it's dashboard
    if(currentPage == "dashboard.html"){
        dashboard("dashboard-panel");
        permissions();
        document.getElementById("logoutButtonText").textContent = "" + localStorage.getItem("username");
    }
}

//logs out of account and redirects to login page
function logout(){
    localStorage.setItem("token", "");
    window.location.replace("./index.html");
}

//if a user doesn't have the elevated permissions, we need to hide certain buttons
function permissions(){
    var perms = parseInt(localStorage.getItem("permissions"));

    console.log(perms);

    //level 1 - View Deliveries
    if(perms < 2){
        document.getElementById("email-records-button").style.display = "none";
        document.getElementById("app-log-button").style.display = "none";
        document.getElementById("employees-button").style.display = "none";
        document.getElementById("delivery-records-button").style.display = "none";
        document.getElementById("new-delivery-button").style.display = "none";
        document.getElementById("mail-button").style.display = "none";
    }
    //level 2 - Add/Remove Deliveries
    else if (perms < 3){
        document.getElementById("email-records-button").style.display = "none";
        document.getElementById("app-log-button").style.display = "none";
        document.getElementById("employees-button").style.display = "none";
        document.getElementById("delivery-records-button").style.display = "none";
        document.getElementById("mail-button").style.display = "none";
    }
    //level 3 - View Delivery Records
    else if (perms < 4){
        document.getElementById("email-records-button").style.display = "none";
        document.getElementById("app-log-button").style.display = "none";
        document.getElementById("employees-button").style.display = "none";
        document.getElementById("mail-button").style.display = "none";
    }
    //level 4 - Edit Delivery Records
    else if (perms < 5){        
        document.getElementById("app-log-button").style.display = "none";
        document.getElementById("employees-button").style.display = "none";
    }
    //level 5 - Administrator
    else if (perms < 6){        
        document.getElementById("app-log-button").style.display = "none";
    }
    //level 6 dont need to do anything

    if(perms > 1){
        loadCustomers();
    }
}

//returns a string like guest, administrator, etc
function getPermissionName(perm){
    switch(perm){
        case 1:
            return "Reader <span class=\"dot\" style=\"background-color: grey;\"></span>"; break;
        case 2:
            return "Contributor <span class=\"dot\" style=\"background-color: #7aff82;\"></span>"; break;
        case 3:
            return "Standard <span class=\"dot\" style=\"background-color: #a8ff1c;\"></span>"; break;
        case 4:
            return "Owner <span class=\"dot\" style=\"background-color: #ffa41c;\"></span>"; break;
        case 5:
            return "Administrator <span class=\"dot\" style=\"background-color: #ff511c;\"></span>"; break;
        case 6:
            return "Administrator <span class=\"dot\" style=\"background-color: #ff511c;\"></span>"; break;
        default:
            return ""; break;
    }
}

//prints out the div
function printDiv(divName) {
    var originalContents = document.body.innerHTML;

    //disabling certain elements
    document.getElementById("sideBar").style.display = "none";
    document.getElementById("print-deliveries").style.width = "95%";

    //disabling no see objects
    var elements = document.getElementsByClassName("print-no-see");
    for(var b = 0; b < elements.length; b++){
        elements[b].style.display = "none";
    }

    //narrowing the width between deliveries
    var elements2 = document.getElementsByClassName("print-size-change");
    for(var a = 0; a < elements2.length; a++){
        var text = elements2[a].innerText;
        elements2[a].innerHTML = "<h2>" + text + "</h2>";
    }

    var elements3 = document.getElementsByClassName("delivery-block");
    for(var x = 0; x < elements3.length; x++){
        elements3[x].style.border = "border: 0.15vw solid #b1b1b1;"
    }

    //prompting print window
    window.print();
    document.getElementById("sideBar").style.display = "block";

    document.body.innerHTML = originalContents;
}


window.addEventListener("load", (event) => {
    loadLoginCookie();

    windowLoaded();
  });
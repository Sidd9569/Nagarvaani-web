let map;

function initMap(){

map = new google.maps.Map(document.getElementById("map"),{

center:{lat:28.6139,lng:77.2090},
zoom:12

});

loadIssues();

}

async function loadIssues(){

try {
  const res = await fetch("http://localhost:5000/api/issues");
  const data = await res.json();
  
  // Handle both array response and error response
  const issues = Array.isArray(data) ? data : [];
  
  if (!issues || issues.length === 0) {
    console.log("No issues found");
    return;
  }
  
  issues.forEach(issue=>{
    new google.maps.Marker({
      position:{
        lat: parseFloat(issue.latitude),
        lng: parseFloat(issue.longitude)
      },
      map:map,
      title:issue.issueType
    });
  });
} catch (error) {
  console.error("Error loading issues:", error);
}

}

window.initMap = initMap;
// Navbar scroll effect

window.addEventListener("scroll", () => {

const nav = document.querySelector("nav");

if(window.scrollY > 50){
nav.style.background = "#000";
}
else{
nav.style.background = "rgba(0,0,0,0.6)";
}

});

// simple page animation

document.addEventListener("DOMContentLoaded", () => {

document.body.classList.add("fade-in");

});
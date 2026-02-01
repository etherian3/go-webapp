package main

import (
	"log"
	"net/http"
)

func canvasPaintPage(w http.ResponseWriter, r *http.Request) {
	// Render the canvas paint html page
	http.ServeFile(w, r, "static/canvas-paint.html")
}

func homePage(w http.ResponseWriter, r *http.Request) {
	// Redirect to canvas page
	http.Redirect(w, r, "/canvas", http.StatusSeeOther)
}

func main() {
	// Serve static files (CSS, JS, images)
	fs := http.FileServer(http.Dir("static"))
	http.Handle("/static/", http.StripPrefix("/static/", fs))

	// Canvas paint page route
	http.HandleFunc("/canvas", canvasPaintPage)

	// Home page route
	http.HandleFunc("/", homePage)

	err := http.ListenAndServe("0.0.0.0:8080", nil)
	if err != nil {
		log.Fatal(err)
	}
}

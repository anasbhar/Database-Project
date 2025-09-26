function handleFormSubmit(event) {
    event.preventDefault();
    const xhr = new XMLHttpRequest();

    xhr.onreadystatechange = function () {
        if (xhr.readyState == 4 && (xhr.status == 200)) {
            result = xhr.responseText;
            document.getElementById("div1").innerHTML = result;
        }
    };

    // We don't submit the html form in the normal way, we create a formdata object and then urlencode it
    // The backend can receive it as if it was a regular form
    const formData = new FormData(event.target);

    // for optional fields, default values if no user input
    if (!formData.get("locationSize")?.trim()) formData.set("locationSize", "NULL");
    if (!formData.get("locationGeneralManagerID")?.trim()) formData.set("locationGeneralManagerID", "NULL");

    xhr.open("POST", "/sendSQL", true);
    console.log("DATA INCOMING");
    const urlEncoded = new URLSearchParams(formData).toString();
    xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
    xhr.send(urlEncoded);
};

console.log("woooooooooooooooooo")
// Replacing the default submit action with our own
// ONLY FOR THE CUSTOM SQL
const form1 = document.getElementById("form1");
form1.addEventListener("submit", handleFormSubmit);

// Hide forms when not selected
// AND
// Event listener for each form

document.addEventListener("DOMContentLoaded", function () {
    const dropDownBoxes = document.querySelectorAll(".dropdown-box");

    dropDownBoxes.forEach((box, questionNumber) => {
        const select = box.querySelector(".dropdown-select");
        const contentDivs = box.querySelectorAll(".dropdown-content");

        // Only add dropdown box event listeners for the first 6 questions, the others don't have dropdown boxes
        if (questionNumber < 6) {
            select.addEventListener("change", () => {
                const selectedValue = select.value;

                contentDivs.forEach(div => {
                    if (div.dataset.value === selectedValue) {
                        div.style.display = "block";
                    } else {
                        div.style.display = "none";
                    }
                });
            });
        }

        
        // Add form event listeners
        // Each form sends its info to a different route
        const forms = box.getElementsByTagName("form");
        Array.from(forms).forEach((form, formIndex) => {
            form.addEventListener("submit", (event) => {
                event.preventDefault();
                
                const xhr = new XMLHttpRequest();
                xhr.onreadystatechange = function () {
                    if (xhr.readyState == 4 && (xhr.status == 200)) {
                        result = xhr.responseText;
                        // Create a div just below the current form element, and put the result there
                        // First check if there already is a result there
                        const nextElement = form.nextElementSibling;
                        if (nextElement && nextElement.tagName === "DIV" && nextElement.classList.contains("response-div")) {
                            nextElement.innerHTML = result;
                        } else {
                            const newDiv = document.createElement("div");
                            newDiv.classList.add("response-div");
                            newDiv.innerHTML = result;
                            form.parentNode.insertBefore(newDiv, form.nextSibling);
                        }
                        
                    }
                };

                const formData = new FormData(event.target);
                console.log("q#" + questionNumber);
                console.log("formNumber:" + formIndex);
                xhr.open("POST", `/sendForm/${questionNumber}/${formIndex}`, true);
                console.log("DATA INCOMING");
                const urlEncoded = new URLSearchParams(formData).toString();
                xhr.setRequestHeader("Content-type", "application/x-www-form-urlencoded");
                xhr.send(urlEncoded);
            });
        });
    });
});
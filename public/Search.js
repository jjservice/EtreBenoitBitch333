        // Search Bar function
        function searchProducts() {
            let input = document.getElementById('search-bar').value.toLowerCase();
          
            // Remove period from the end of the input if exists
            if (input.endsWith('.')) {
              input = input.slice(0, -1);
            }
          
            let products = document.getElementsByClassName('product');
            
            // Loop through all products and filter them based on the search input
            for (let i = 0; i < products.length; i++) {
              let productName = products[i].getElementsByTagName('h3')[0].textContent.toLowerCase();
              if (productName.includes(input)) {
                products[i].style.display = '';  // Show product if it matches search
              } else {
                products[i].style.display = 'none';  // Hide product if it doesn't match search
              }
            }
          }
          
          
          // Voice search functionality
          const voiceSearchButton = document.getElementById('voice-search-btn');
          const searchBar = document.getElementById('search-bar');
          const languageSelect = document.getElementById('language-select');
          
          // Check if browser supports SpeechRecognition
          const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition;
          const recognition = new SpeechRecognition();
          
          // Set the initial language (default to English)
          recognition.lang = languageSelect.value;
          
          let sound = new Audio('Cut-Voice-Notification-Sound.mp3'); // Path to your notification sound file
          
          // Listen for language change and update the language of recognition
          languageSelect.addEventListener('change', function() {
            recognition.lang = languageSelect.value;
          });
          
          // Start voice recognition when the button is clicked
          voiceSearchButton.addEventListener('click', function() {
            recognition.start();  // Start voice recognition
            searchBar.value = '';  // Clear the search bar to show voice input
            // Don't play sound immediately; will play once letters show up in the input
          });
          
          
          recognition.onresult = function(event) {
            let transcript = event.results[0][0].transcript.toLowerCase();  // Get the speech-to-text result
          
           
            if (transcript.endsWith('.')) {
              transcript = transcript.slice(0, -1);
            }
          
            searchBar.value = transcript;  // Update the search bar with the transcript
            searchProducts();  // Perform search with the voice input
          
            // Play the notification sound only if there is a valid search input in the search bar
            if (transcript.length > 0) {
              sound.play();
            }
          };
          
          // Optional: Handle errors in speech recognition
          recognition.onerror = function(event) {
            console.log("Error occurred in recognition: " + event.error);
          };

          


          /////Open Modal////
          let currentImageIndex = 0; // To keep track of which image is currently shown
    let imageArray = []; // Array to store multiple image sources

    function openModal(images) {
      imageArray = images; // Store the array of images
      currentImageIndex = 0; // Reset to first image
      const modal = document.getElementById('productModal');
      const modalImage = document.getElementById('modalImage');
      modalImage.src = imageArray[currentImageIndex];  // Set the first image in modal
      modal.style.display = 'block'; // Show the modal
    }

    function closeModal() {
      const modal = document.getElementById('productModal');
      modal.style.display = 'none'; // Hide the modal
    }

    // Change image based on the button clicked (next/prev)
    function changeImage(direction) {
      currentImageIndex += direction;
      
      // If at the start or end, loop around
      if (currentImageIndex < 0) {
        currentImageIndex = imageArray.length - 1;
      } else if (currentImageIndex >= imageArray.length) {
        currentImageIndex = 0;
      }
      
      const modalImage = document.getElementById('modalImage');
      modalImage.src = imageArray[currentImageIndex]; // Set the new image
    }

    // When the user clicks anywhere outside the modal, close it
    window.onclick = function(event) {
      const modal = document.getElementById('productModal');
      if (event.target === modal) {
        closeModal();
      }
    }



    //////Search Button Push/////

    function toggleSearchBar() {
      const searchBar = document.querySelector('.search-bar4');
      const buttons = document.querySelectorAll('.button4:not([onclick="toggleSearchBar()"])'); // All buttons except the toggle button
      const showSearchButton = document.querySelector('.button4[onclick="toggleSearchBar()"]');
      
      if (searchBar.style.display === 'none' || searchBar.style.display === '') {
          searchBar.style.display = 'block';  // Show the search bar
          
          // Hide all buttons except the "Show Search" button
          buttons.forEach(button => button.style.display = 'none');
          showSearchButton.innerHTML = '<i class="fas fa-times"></i>'; // Change button text
      } else {
          searchBar.style.display = 'none';  // Hide the search bar
          
          // Show all buttons again
          buttons.forEach(button => button.style.display = 'inline-block');
          showSearchButton.innerHTML = '<i class="fas fa-search"></i>'; 
      }
  }
   


  ////sideBar///////

    const sideBar = document.querySelector(".open-btn-sidebar");
    const bodysideBar = document.querySelector(".sidebar");

      // Open the sidebar
      function openNav() {
        document.getElementById("mySidebar").classList.add("open");
        sideBar.style.color = "gold";
        sideBar.style.borderRadius = "10px"; 
        
        bodysideBar.style.borderLeft = "2px solid gold";
        
    }

    // Close the sidebar
    function closeNav() {
        document.getElementById("mySidebar").classList.remove("open");
        sideBar.style.color = "white";
        sideBar.style.textShadow = "1px 1px 4px gold";
        bodysideBar.style.borderLeft = "none";
      }
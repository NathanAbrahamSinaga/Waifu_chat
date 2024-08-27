<script>
    import ChatBox from "../lib/ChatBox.svelte";
    import { onMount } from 'svelte';
  
    let audio;
    let isPlaying = false;
  
    onMount(() => {
      audio = new Audio('/background-music.mp3');
      audio.loop = true;
  
      // Mencoba autoplay
      playAudio().catch(error => {
        console.log("Autoplay prevented. Please use the play button.");
      });
    });
  
    async function playAudio() {
      try {
        await audio.play();
        isPlaying = true;
      } catch (error) {
        console.error("Error playing audio:", error);
      }
    }
  
    function toggleAudio() {
      if (isPlaying) {
        audio.pause();
        isPlaying = false;
      } else {
        playAudio();
      }
    }
  </script>
  
  <main class="relative h-screen overflow-hidden">
    <video autoplay loop muted class="absolute z-0 w-full h-full object-cover">
      <source src="/waifu.mp4" type="video/mp4">
      Your browser does not support the video tag.
    </video>
  
    <div class="relative z-10 container mx-auto p-4 h-full">
      <div class="flex justify-between items-center mb-4">
        <h1 class="text-3xl font-bold text-white">Chat w/ Istrimu</h1>
        <button 
          on:click={toggleAudio} 
          class="bg-purple-500 text-white px-4 py-2 rounded-lg"
        >
          {isPlaying ? 'Pause Music' : 'Play Music'}
        </button>
      </div>
      <div class="flex h-[calc(100%-4rem)]">
        <div class="w-1/3">
          <img src="/waifu.png" alt="Waifu" class="w-full rounded-lg shadow-lg" />
        </div>
        <div class="w-2/3 pl-4 h-full">
          <ChatBox />
        </div>
      </div>
    </div>
  </main>
  
  <style>
    :global(body) {
      margin: 0;
      padding: 0;
    }
  </style>
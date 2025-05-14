<template>
  <div class="container">
    <div class="hero-graphic">
      <img src="/LOGO.png" alt="Logo Image" class="logo" />
      <div class="graphic-accent"></div>
    </div>

    <div class="content">
      <h2>Track with ease,<br /> spend with peace!</h2>
      <p>
        Money Log is a budget tracker website focused on helping users manage and track their expenses. This program allows users to record their expenses, categorize transactions, and follow their financial budget over time.
        Money Log also provides a group expense feature that allows families, roommates, and groups of friends to track their joint expenses. Users can form groups, add shared expenses and provide an overview of the group expenses.
        This feature ensures that managing personal and group finances is easy and convenient.
      </p>
    </div>
  </div>
</template>



<script scoped>
import Navigation from "./navigation.vue";
 
export default {
  components: { Navigation },
  data() {
    return {
      // 👇 Add for protected data
      userInfo: null,
      error: null
    };
  },
  mounted() {
    // 🔐 Call protected API
    fetch('http://localhost:3000/api/users/', { // Changed port from 8000 to 3000
    headers: {
      'Authorization': 'Bearer ' + localStorage.getItem('jsontoken'), // Changed from authToken
      'Accept': 'application/json'
    }
  })
    .then(res => {
      if (!res.ok) throw new Error(res.statusText);
      return res.json();
    })
    .then(data => {
      this.userInfo = data;
    })
    .catch(err => {
      console.error("API Error:", err);
      this.error = "Failed to load user data";
    });
},
};
</script>


<style>
body {
  font-family: 'Poppins', sans-serif;
  margin: 0;
  padding: 0;
  width: 100%;
  background-color: #fcffed;
  overflow-x: hidden;
  overflow-y: auto;
}
</style>

<style scoped>
.container {
  display: flex;
  flex-direction: row; /* horizontal layout */
  align-items: center;
  justify-content: space-between;
  padding: 0 50px;
  gap: 60px;
  min-height: 90vh;
} 


.logo {
  width: 450px; /* Adjust size */
  height: 450px;
  margin-top: 70px;
  margin-left: 20px;
}

.content {
  display: flex;
  flex: 1; 
  flex-direction: column;
  justify-content: flex-end;
  text-align: right;
  color: black; 
  font-size: 20px;
  margin-top: 100px;
}

.content h2 {
  font-size: 2.5em; 
  font-weight: bold;
  text-align: center;
  margin-bottom: 10px;
}

.content p {
  font-size: 1.3em;
  font-style: italic;
  text-align: justify;
}

/* RESPONSIVE DESIGN */

@media only screen and (max-width: 1280px) {
  .logo {
    width: 450px;
    height: 450px;
  }

  .content {
    align-items: center;
    text-align: center;
    margin-right: 10px;
    margin-top: 130px;
    padding: 0;
  }
  .content h2 {
    font-size: 2em;
    margin: 0;
    margin-bottom: 20px;
  }
  .content p {
    font-size: 1.2em;
    margin: 0;
  }
}

@media only screen and (max-width: 1120px) {
  .logo {
    width: 420px;
    height: 420px;
  }
  .content {
    align-items: center;
    text-align: center;
    margin-right: 10px;
    margin-top: 130px;
    padding: 0;
  }
  .content h2 {
    font-size: 2em;
    margin: 0;
    margin-bottom: 20px;
  }
  .content p {
    font-size: 1.1em;
  }
}

@media only screen and (max-width: 1000px) {
  .container {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }
  .logo {
    margin-top: 90px;
    width: 400px;
    height: 400px;
  }
  .content{
    margin: 0;
  }
  .content h2 {
    margin-top: 10px;
    font-size: 1.8em;
  }
  .content p {
    font-size: 1em;
    margin-bottom: 20px;
  }
}

@media only screen and (max-width: 480px) {
  .container {
    flex-direction: column;
    align-items: center;
    gap: 20px;
  }

  .logo {
    width: 350px;
    height: 350px;
    margin-left: -10px;
    margin-top: 90px;
  }
  .content{
    margin: 0;
  }
  .content h2 {
    margin-top: 10px;
    font-size: 1.5em;
  }
  .content p {
    font-size: 1em;
    margin-bottom: 20px;
  }
}

</style>

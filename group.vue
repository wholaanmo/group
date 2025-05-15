<template>
  <header :class="{ 'scrolled-nav': scrolledNav}">
  <nav>
    <div class="branding">
      <img src="/LOGO.png" alt="Money Log Logo"/>
    </div>
  <ul v-show="!mobile" class="navigation">
    <li><router-link class="link" to="/personal">PERSONAL</router-link></li>
    <li><router-link class="link" to="/GC">GROUP</router-link></li>
    <li><router-link class="link" to="/view">PERSONAL VIEW</router-link></li>
    <li><router-link class="link" to="/groupview">GROUP VIEW</router-link></li>
    <router-link to="/profile" class="profile-trigger" aria-label="Profile">
      <i class="fas fa-user-circle" style="font-size: 30px; cursor: pointer;"></i>
  </router-link>

  </ul>
  <div class="icon" @click="toggleMobileNav" v-show="mobile">
  <i :class="['fas', mobileNav ? 'fa-bars' : 'fa-bars']"></i>
</div>
  <transition name="mobile-nav">
    <ul v-show="mobileNav" class="dropdown-nav">
      <div class="drop">
    <li><router-link class="link" to="/personal">PERSONAL</router-link></li>
    <li><router-link class="link" to="/GC">GROUP</router-link></li>
    <li><router-link class="link" to="/view">PERSONAL VIEW</router-link></li>
    <li><router-link class="link" to="/groupview">GROUP VIEW</router-link></li>  
    <router-link to="/profile" class="user" aria-label="Profile">
      <i class="fas fa-user-circle" style="font-size: 30px; cursor: pointer; margin: 5px;"></i>
    </router-link>
    </div>


  </ul>
  </transition>
  </nav>
  </header>

  </template>

<script>
export default {
name: "navigation",
data() {
  return {
    scrolledNav: null,
    mobile: null,
    mobileNav: null,
    windowwidth: null,
  };
},
created() {
  window.addEventListener('resize', this.checkScreen);
  this.checkScreen();
},
mounted() {
  window.addEventListener("scroll", this.updateScroll);
},
methods: {
  toggleMobileNav() {
  this.mobileNav = !this.mobileNav;
},

updateScroll() {
  const scrollPosition = window.scrollY;
  if (scrollPosition > 50) {
    return;
  }
  this.scrolledNav = false;
},

checkScreen(){
  this.windowWidth = window.innerWidth;
  if (this.windowWidth <=800){
    this.mobile = true;
    return;
  }
  this.mobile = false;
  this.mobileNav = false;
  return;
},
},
};

</script>


<style scoped>
header {
  position: fixed;
  background: linear-gradient(135deg, #6A9C89 25%, #4E7E6A 60%, #3b6451 90%);
  z-index: 99;
  width: 102%;
  transition: .5s ease all;
  height: 120px;
  margin-left: -10px;
  margin-top: -10px;
  box-shadow: 0 4px 10px rgba(0, 0, 0, 0.1);
}

nav {
font-family: 'Poppins', sans-serif;
position: relative;
display: flex;
flex-direction: row;
padding: 8px 0;
transition: .5s ease all;
width: 90%;
margin-left: 40px;

ul, 
.link {
font-weight: 500;
color: #fcffed;
list-style: none;
text-decoration: none;
}

.user {
font-weight: 500;
color: #fcffed;
list-style: none;
text-decoration: none;
}


li {
text-transform: uppercase;
padding: 14px;
margin-left: 15px;
}

.link {
  font-size: 16px;
  position: relative;
  transition: color 0.3s ease;
  color: #fcffed;
  text-decoration: none;
  padding-bottom: 2px;
  font-weight: 500;
}
.link::after {
  content: '';
  position: absolute;
  left: 0;
  bottom: 0;
  height: 2px;
  width: 100%;
  background: #fcffed;
  transform: scaleX(0);
  transform-origin: left;
  transition: transform 0.3s ease;
}

.link:hover {
  color: #ffffff;
  text-shadow: 0 1px 3px rgba(255, 255, 255, 0.6);
}

.link:hover::after {
  transform: scaleX(1);
}

.branding {
display: flex;
align-items: center;

img {
  width: 110px;
  height: auto;
  transition: .5s ease all;
  margin-top: 2px;
  margin-left: -10px;
}
}

.navigation {
display: flex;
align-items: end;
flex: 1;
justify-content: flex-end;
margin-top: 50px;
font-family: Arial, Helvetica, sans-serif;
}

.icon {
display: flex;
align-items: center;
position: absolute;
top: 0;
right: 24px;
height: 100%;
color: #fcffed;

i {
  cursor: pointer;
  font-size: 24px;
  transition: .8s ease all;
}
}

.icon-active {
transform: rotate(180deg);
}

.drop {
  margin-top: 20px;
}

.dropdown-nav {
  display: flex;
  flex-direction: column;
  position: fixed;
  width: 100%;
  max-width: 200px;
  height: 100vh;
  background: linear-gradient(180deg, #f0f5f2, #e8f1ed); /* soft complimentary background */
  margin-top: 2px;
  left: 0;
  padding: 20px 10px;
  border-right: 1px solid #d2e3dc;
  box-shadow: 2px 0 8px rgba(0, 0, 0, 0.05);
  font-family: 'Poppins', sans-serif;
}

.dropdown-nav li {
  margin-left: 0;
  margin: 10px 0;
  padding: 10px 12px;
  border-radius: 8px;
  transition: background-color 0.3s ease, color 0.3s ease;
}

.dropdown-nav li:hover {
  background-color: #dfeee7;
  cursor: pointer;
}

.dropdown-nav .link {
  color: #2a4935;
  font-weight: 500;
  text-decoration: none;
  transition: color 0.3s ease;
}

.dropdown-nav .link:hover {
  color: #3b6451;
}

.dropdown-nav .user {
  color: #3b6451;
  margin-left: 10px;
  margin-top: 10px;
  font-weight: 600;
}

.mobile-nav-enter-active,
.mobile-nav-leave-active {
  transition:  1s ease all;
}

.mobile-nav-enter-from,
.mobile-nav-leave-to {
  transform: translateX(-250px);
}

.mobile-nav-enter-to{
  transform: translateX(0);
}
}

.scrolled-nav {
background-color: #000;
box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba (0, 0, 0, 0.6);

nav {
  padding: 18px 0;

  .branding {
    img {
      width: 40px;
      box-shadow: 0 4px 6px -1px rgba(0,0,0,0.1), 0 2px 4px -1px rgba (0, 0, 0, 0.6);
    }
  }
}
}

.profile-trigger {
font-size: 30px;
color: #fcffed; 
transition: color 0.3s ease, transform 0.3s ease;
margin-left: 10px;
cursor: pointer;
display: flex;
align-items: center;
position: relative;
right: -20px;
bottom: 10px;
text-decoration: none;

&:hover {
  color: black;
  border-color: black;
}
}

.profile-trigger:hover {
transform: scale(1.1); 

}
.profile-overlay {
position: fixed;
top: 0;
left: 0;
width: 100%;
height: 100%;
display: flex;
justify-content: center;
align-items: center;
z-index: 1000;
}

</style>

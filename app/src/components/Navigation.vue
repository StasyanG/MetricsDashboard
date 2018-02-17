<template>
  <nav class="navigation">
    <ul>
      <router-link tag="li" to="/"><a href="/">Home</a></router-link>
      <router-link tag="li" to="/add"><a>Add new</a></router-link>
      <router-link tag="li" to="/support"><a>Support</a></router-link>
    </ul>
  </nav>
</template>

<script>
export default {
  name: 'Navigation'
}
</script>

<style scoped>
ul {
  list-style-type: none;
  margin: 0;
  padding: 0;
  overflow: hidden;
}
li {
  float: left;
}
li a {
  display: block;
  text-align: center;
  padding: 14px 16px;
  text-decoration: none;
}
li a:hover {
  color: #333;
}
</style>
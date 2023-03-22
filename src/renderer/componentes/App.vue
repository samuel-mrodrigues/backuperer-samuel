<template>
  <div>
    <h1>OI GENTE</h1>

    <button @click="teste()">Oi</button>
  </div>
</template>

<script>
import fs from "fs";

export default {
  name: 'App',
  methods: {
    teste() {
      // console.log(dialog, app, ipcRenderer);
      console.log(fs.existsSync('./teste.txt'))
    }
  }
}
</script>

<style>
#app {
  font-family: Avenir, Helvetica, Arial, sans-serif;
  -webkit-font-smoothing: antialiased;
  -moz-osx-font-smoothing: grayscale;
  text-align: center;
  color: #2c3e50;
  margin-top: 60px;
}
</style>

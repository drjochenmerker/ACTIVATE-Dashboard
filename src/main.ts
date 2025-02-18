import { createApp } from 'vue';
import './style.css';
import App from './App.vue';
import router from './router';

// Added a function to the string type that allows to replace multiple strings at once
declare global {
    interface String {
        replaceMultiple(mapObj: { [key: string]: string }): string;
    }
}

String.prototype.replaceMultiple = function (mapObj) {
    var re = new RegExp(Object.keys(mapObj).join("|"), "gi");

    return this.replace(re, function (matched) {
        return mapObj[matched];
    });
};

// Create the app and mount it to the DOM
const app = createApp(App);
app.use(router);
app.mount('#app');

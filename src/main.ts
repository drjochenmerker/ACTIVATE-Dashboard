import { createApp } from 'vue';
import { createPinia } from 'pinia';
import './style.css';
import App from './App.vue';
import router from './router';
import Toast from 'vue-toastification';
import 'vue-toastification/dist/index.css';

// Added a function to the string type that allows to replace multiple strings at once
declare global {
    interface String {
        replaceMultiple(mapObj: { [key: string]: string }): string;
    }
}

const pinia = createPinia();

String.prototype.replaceMultiple = function (mapObj) {
    const re = new RegExp(Object.keys(mapObj).join('|'), 'gi');

    return this.replace(re, function (matched) {
        return mapObj[matched];
    });
};

// Create the app and mount it to the DOM
const app = createApp(App);
app.use(pinia);
app.use(Toast);
app.use(router);
app.mount('#app');

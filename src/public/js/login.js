import { api, Endpoints } from "./api.js";

const { createApp } = Vue;

createApp({
  data() {
    return {
      username: "",
      password: "",
      error: "",
      animate: false,
    };
  },
  methods: {
    async loginAttempt() {
      const body = { username: this.username, password: this.password };

      try {
        const response = await api.post(Endpoints.LOGIN, body);

        sessionStorage.user = JSON.stringify({
          username: body.username,
          password: body.password,
          avatar: response.data.avatar,
        });

        window.location.href = "/chat";
      } catch (error) {
        if (error.response.status === 403) {
          this.error = error.response.data.description;
          this.animate = !this.animate;

          setTimeout(() => {
            this.animate = !this.animate;
          }, 1000);
        } else {
          this.register();
        }
      }
    },
    async register() {
      try {
        const body = {
          username: this.username,
          password: this.password,
          avatar: "",
        };

        await api.post(Endpoints.USER, body);

        sessionStorage.user = JSON.stringify(body);
        window.location.href = "/chat";
      } catch (error) {
        this.error = error.response.data.description;
        this.animate = !this.animate;

        setTimeout(() => {
          this.animate = !this.animate;
        }, 1000);
      }
    },
    clearUsernameInput() {
      this.username = "";
      this.error = "";
    },
    clearPasswordInput() {
      this.password = "";
      this.error = "";
    },
  },
  async mounted() {
    if (sessionStorage.user) {
      const user = JSON.parse(sessionStorage.user);

      try {
        const body = { username: user.username, password: user.password };

        const response = await api.post(Endpoints.LOGIN, body);

        sessionStorage.user = JSON.stringify({
          username: body.username,
          password: body.password,
          avatar: response.data.avatar,
        });

        window.location.href = "/chat";
      } catch (error) {
        sessionStorage.removeItem("user");
      }
    }
  },
}).mount("#app");

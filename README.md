# beanstalkd-dashboard

<img src="./assets/logo.svg" style="width: 20em;" />


beanstalkd-dashboard is a monitoring tool for [beanstalkd](https://github.com/beanstalkd/beanstalkd) servers.

## Installation & Usage

Install:
```sh
npm i -g beanstalkd-dashboard
```

Run and open [http://localhost:3000](http://localhost:3000):
```sh
beanstalkd-dashboard # listens on
```

Listen on specific host/port:
```sh
beanstalkd-dashboard --host 0.0.0.0 --port 1234
```

Connect to multiple servers:
```sh
beanstalkd-dashboard --servers localhost:11300,beanstalkd1:11300,beanstalkd2:11300
```


### Features

#### View All Tubes And Their Stats

<img src="./assets/beanstalkd-dashboard home.png" style="width: 40em;" />


#### Manage multiple beanstalkd servers.
Use `--servers` option to provide multiple beanstalkd server addresses so you can easily manage and monitor them from a single place.

<img src="./assets/servers.png" style="width: 20em;" />

#### View Tube Details

- All the stats about the jobs, executed commands and connections of the tube (automatically refreshed).
- The next job in `ready`, `delayed` and `buried` states.

<img src="./assets/beanstalkd-dashboard-tube-details.png" />

#### Pause & Resume Tubes and Display Remaining Time to Resume

https://github.com/user-attachments/assets/af40b3d4-7da4-4855-a2bb-410df8d54209

#### Show/Hide Table Columns
<img src="./assets/beanstalkd-dashboard-show-hide-columns.png" style="width: 15em;" />

### Tech Stack
- TypeScript
- [beanstalkd-ts](https://github.com/fatihky/beanstalkd-ts): beanstalkd client with full typescript support. (still in beta)
- [trpc](https://github.com/trpc/trpc)

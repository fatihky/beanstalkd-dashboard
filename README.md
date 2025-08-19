# beanstalkd-dashboard

<img src="./assets/logo.svg" style="width: 20em;" />


beanstalkd-dashboard is a monitoring tool for [beanstalkd](https://github.com/beanstalkd/beanstalkd) servers.


### Tech Stack
- TypeScript
- [beanstalkd-ts](https://github.com/fatihky/beanstalkd-ts): beanstalkd client with full typescript support. (still in beta)
- [trpc](https://github.com/trpc/trpc)


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

<video controls src="./assets/beanstalkd-dashboard-pause-resume-tube.mp4"></video>

#### Show/Hide Table Columns
<img src="./assets/beanstalkd-dashboard-show-hide-columns.png" style="width: 15em;" />

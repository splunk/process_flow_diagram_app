# process_flow_diagram_app

![Example](./assets/example.png)

Modular visualization for process flows. 
Based on the open source [joint.js](https://jointjs.com) library.
## Installation

1. Download the app `.tar.gz` bundle from Releases
2. Install through Splunk Enterprise UI ("Manage Apps")

## Usage

Review example dashboards provided with the app for usage reference. Generally, the modular visualization expects the process data to be supplied in the following format: `| table corrID fromStep toStep fromStepDuration`. This means that the process data needs to be transformed into this edge representation where each row in the results represents a transition instance. Transition instances that belong to the same process instance are grouped by `corrID`.

## License
Please review [`LICENSE.md`](./LICENSE.md)

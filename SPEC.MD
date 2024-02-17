## Seattle Collisions Spec
The goal of this project is to create a web based dashboard to show traffic collisions within Seattle boundaries. Our target audience is city council members, traffic engineers, civil project engineers and other traffic related decision makers. Our goal is to create a dashboard that informs of general collision patterns, as well as insights that cannot be gained elsewhere. This includes mapping analysis, KPI's, and charts to show collision rates and patterns of different intersections/roads.

### Goals
* Create an simple GUI that can be understood by both technical and non-technical stakeholders.
    * No technical filters or massive drop down menus.
    * Adequate documentation i.e. on load pop up.
* Present traffic collision patterns and insights.
    * Show traffic collisions on a zoomable heatmap.
    * Point collisions at a higher zoom level using a color ramp to show injury frequencies.
    * Create a left hand analytics side bar that shows:
        * Total collisions within mapping window.
        * Collisions over time.
        * Collisions counts involving intoxicated drivers/inattentive drivers.
        * Fatal crash counts.
* Create a valuable portfolio project for employment purposes.
    * Develop proficiency in the ArcGIS Javascript SDK. 
    * Call traffic collision data from the Seattle GeoData API.
    * Develop a scalable web app with minimal local processing.
    * Create a responsive web design with collapsable menus for mobile users/

### Stakeholders
* On the development side our stakeholders are the five of us, our teacher Bo, SDOT, policy makers or other potential contract interests.
* The insights could go on to improve roads for other stakeholders including drivers, pedestrians, bicyclists, commuters, and public transport.

### Requirements

#### Functional Requirements
* By the end of our four week development time the map MUST:
    * Load collision data from the Seattle GeoData API.
    * Display a working heatmap which is easily understandable.
    * Display a working color ramped point layer to display injury rates at adequate zoom.
    * Display at least 2 KPIs on window idle.
* Reach requirements:
    * Display two D3 charts showing collisions over time or fatalities over time based on window idle.

#### Non-functional Requirements
* Must provide adequate resources for the audience to understand the map. 
    * On-load acknowledgement of restraints.
    * Clickable information popup to explain GUI.

### Design Specifications 
* Main view comprises of two parts:
    * Left hand side collapsable panel taking up 1/4 of the screen to show analytics.
        * Comprises of two KPIs (text analytics) at the top of the panel.
        * One (for now) chart visualization below the two KPIs.
    * Right hand side map that comprises the rest of the screen.
        * Displays a zoomable heatmap and point layer of collisions.
    * Color legend that switches at zoom from heatmap to point layer.
        * Shows heatmap color ramp at low zoom, and then point layer color ramp at high zoom.
* Additional designs:
    * On load pop up to display restraints/considerations.
    * Info icon in the top right that triggers pop-up to explain the GUI.

### Technical Specifications
* The development will be completed with these languages and libraries.
    * HTML/CSS/JS
    * ArcGIS Javascript SDK
    * D3.js
    * Turf.js
* Backend will be handled through a call to the Seattle GeoData API for collisions.
    * Known as Collisions All Years.
    * Easily called as it is being hosted on ArcGIS Online.

### Development Roadmap
* Project Proposal 02.11.24 COMPLETE
    * Describe project plan and usable data/libraries.
* Project Prototype 2.18.24
    * Develop GUI using Figma. Type of project should already be determined (Smart Dashboard).
* Project Proposal Revision 2.26.24
    * Revise project proposal, create github repo.
    * Heatmap should be fully developed at this point. 
    * Reach goal is to also have the point layer developed.
* Final Project Checkpoint 3.3.24
    * Create a list of issues/bugs.
    * Develop roadmap for D3 visualizations.
    * Reroute based on time constraints.
* Final Project Presentation 3.10.24
    * Present project.

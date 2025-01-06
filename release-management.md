# Release Management

Release managers are responsible for the release management lifecycle, focusing on coordinating various aspects of production and projects into one integrated solution. They are responsible for ensuring that resources, timelines, and the overall quality of the process are all considered and accounted for. 

# Steps of Release Management

## Pre release planning:
In this stage, release manager and the team lead will elaborate a plan for the coming release. 
This should take into account:
 - the current issues list (a fair amount of time should be taken to go over the github issues).
 - the current critical bugs.
 - the current roadmap.
 - each team member should be contacted in order to get different opinions feedback about what the next release should contain.

During this phase the github project has to be filled with the issues that are going to be addressed.

## Release planning: 
Together with the team, the release manager will refine the list of issues and PRs that should be addressed during the release.
More generally and a non-negligible part of the planning is to properly ensure that bugs, issues that weren't totally identified in the roadmap, and the roadmap issues are still being processed as they should.
During this phase, **all the current project issues have to be assigned.**

After the release planning each one of us has to specify the effort needed for each issue (1 - 2 - 3 - 5 - 8 - 13)

## Release planning - refinement meeting:
This meeting happens a few days after the release planning meeting.
We check all the issues and associated effort and identify critical issues.
e.g:
 - issues that'll need to be split.
 - issues that miss important information.
 - issues that are dependent on each other.
 - issues that require different skills or that the team member is less available during this release.

## Configuring releases: 
Release managers will oversee the various aspects of a project before it is due to be deployed, ensuring everyone is on track and meeting the agreed timeline.

## Quality checks:
The quality of the release needs to be reviewed before a project is officially launched.
The release manager is in charge of ensuring manual testing is properly planned and done.
During the feature freeze time, only the release manager has permission to merge pull requests. As staging should at this point be already deployed, this is to ensure that the release manager has enough visibility on the changes being applied.
Also that unit testing and e2e for new features have been included.

## Deployment: 
After being quality checked, the project is ready to be deployed. 
The release manager is still responsible for ensuring a project is rolled out smoothly and efficiently.

# Release Manager Role:

## Responsibilities overview:

 - Planning release windows and the overall release lifecycle.
 - Managing risks that may affect release scope.
 - Measure and monitor progress.
 - Ensure releases are delivered within requirements.
 - Manage relationships and coordinate projects.

## Detailed Responsibilities:

 - Lead the daily standup meeting.
 - 10 minutes or more are reserved at the end of the daily standup meeting where the release manager update the team on the open PRs (PRs which aim to be delivered in the planned release). 
 - Regular check for new filed issues, identify those that require to be published (included in the release)
 - In some really specific situations, it could be required to deploy intermediate releases (e.g critical bug fixes).
 - Planning, refinement, retrospective meetings have to be organized by the release manager and any other required meetings.
 - Release manager should feel free to implement new techniques and put their own fingerprint to their release, this could potentially benefit upcoming releases.
 - During feature freeze, remix-beta should be updated every morning.
 - A meeting with Andy and Rob should be organized for ensuring the beta test results are properly handled.

## checklist:


### pre release planning

- [ ] create a new project and prioritize issues / bugs with the team lead and according to the current roadmap.
- [ ] check with the team lead if this needs an intermediate release (intermediate release should be 2-3 weeks max).
- [ ] a release kickoff meeting with the team aiming to get input from everyone and modify the project accordingly.
- [ ] 2-3 days span where team members estimate their issues.
- [ ] a release planning meeting where we agree on the release scope (intermediate and/or classic release).
- [ ] after this meeting: all the issues / PR should have been qualified in terms of effort and scope.
- [ ] after this meeting: date for feature freeze, QA period, and release date should be set in the project title.


### coding period

- [ ] 10 min after each daily standup where the release manager gives an update of the current situation and ETA.
- [ ] release manager should make sure to be aware of the current state of each issues and PRs during the coding period in order to have a better overview of who is working on what and best provide support to all the team members that are involved in the release.

### QA preparation

- [ ] prepare the internal QA document, assign team members.
- [ ] prepare the external beta test document for beta testers.
- [ ] 1 week before QA period, start engaging with beta testers and online.

### feature freeze, QA period.

- [ ] publish to remix-beta every day.
- [ ] merge reviewed PRs.
- [ ] a QA open sync meeting where we all do our assigned tasks.

### post release

- [ ] retrospective meeting.


## Assignments:

Aniket, Liana, David, Rob, Filip, Yann

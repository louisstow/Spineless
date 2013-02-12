# Rethinking the need for seperation and MVC

Traditionally best practice dictates that an application will
maintain seperation of concerns. This is usually enforced through
a concept known as MVC (or Model View Controller).

The idea is the business logic and nasty data stuff (the `Model`) exists seperately
from the code that renders it (the `View`).

I'm trying to figure out why this seperation is necessary and if it actually helps
application development. Let's start with the basic question:

*Why would we want to keep these concerns seperated?*

I woud normally answer: "Because views and rendering have a different type of logic to the data."
But that's not true. Usually changes in our data have a 1:1 effect on our rendering. In fact this is
why controllers exist to help the transition of data without dependencies.

So then why is dependency so bad?

"Because we would like to be able swap out these subsystems at any time and reuse them".

This doesn't make sense because any other system that would use the same view(s) or any other
view that uses the same model would.`


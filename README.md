# Lectern

Lectern is a lecture/class engagement and participation platform — like Kahoot! or Slido — created for our UNSW Computer Science Capstone Project, written by Tim Fan, Jack Jiang, Brian Nguyen, Eddie Qi, and Ivan Velickovic.

## Who is Lectern for?

Lectern aims to help instructors deliver engaging lessons for their students. But unlike a real lectern which presents ***to the instructor*** the information and notes that they would want to use to help with engaging students in the lesson, our Lectern web application aims to present ***to the students themselves*** opportunities to engage more with the lesson themselves and actively participate more in the lesson themselves.

### Instructors

For instructors, Lectern provides the tools to create simple, intuitive, and versatile activites for students to engage in with their peers:
- Like multiple-choice quizzes, which instructors can use to measure overall understanding of the lesson so far; and also live polls, which can facilitate conversation between students where opinions or ideas seem to differ;

- Along with open-ended activities like a live QnA session that instructors can start when they are ready to take questions from students both offline and online, and also pause when they feel they should be continuing on with the lesson, which gives students time to think about their questions more too.

``[Insert GIF of Instructor Dashboard, creating activity and opening it.]``

### Students

For students, Lectern provides a way to easily join Lectern sessions that their instructors have opened and shared with them, by either scanning a large QR code on the screen, or by entering in a short room code on the no-account required Lectern web application. When joining a live Lectern session, students have a choice to either use their real name or other nickname, or to provide no name at all and remain anonymous.

``[Insert GIF of Student joining a session, and participating in a just-opened activity.]``

## How does Lectern work?

### Server

#### Data Management using ORM's

In Lectern, instructors would be creating Sessions, within which they can create Activities, within which would contain Choices.

```html
<!-- Name of the Session -->
Introduction to Computer Science
  <!-- Name of an Activity within the Session -->
  What is a pointer?
    <!-- Name of a Choice within the Activity -->
    (A) Using the point . on a variable
    <!-- Name of another Choice within the Activity -->
    (B) An arrow -> pointing to a variable
    <!-- Name of another Choice within the Activity -->
    (C) A variable containing an address
    <!-- Name of another Choice within the Activity -->
    (D) All of the above
```

Using SQL, we would create an Activity table in a relational database like this:

```sql
CREATE TABLE Activity (
  ID        int          
  Name      varchar(255)  -- "What is a pointer?"
  Kind      varchar(255)  -- "Quiz"
  SessionID int           -- The session that this 
                          -- activity belongs to

  PRIMARY KEY (ID)
  FOREIGN KEY (SessionID) REFERENCES Session(ID)
);
```

And a Choice table like this:

```sql
CREATE TABLE Choice (
  ID         int 
  Name       varchar(255)  -- "All of the above"
  NumVotes   int           -- 25
  IsCorrect  boolean       -- false
  ActivityID int           -- The activity that this 
                           -- choice belongs to

  PRIMARY KEY (ID)
  FOREIGN KEY (ActivityID) REFERENCES Activity(ID)
);
```

For Lectern we use an ORM that provides us a way of executing these same kinds of SQL queries for creating, searching, updating and deleting entries and tables, without doing the careful work of writing these SQL query strings by hand.

By using an ORM, instead of writing an SQL query like this to find all the choices that belong to an activity:

```sql
SELECT Name NumVotes IsCorrect FROM Choice
WHERE ActivityID = 3; -- Suppose that this is the ID of the 
                      -- "What is a pointer?" activity
```

We write in simple TypeScript, which is also the same language that the rest of the codebase is written in:

```js
const activity : Activity = await conn.getRepository(Activity).findOne({
  where: {
    id: 3                // We are looking for the 
                         // activity with ID of 3.
  },
  relations: ["choices"] // And we want to load the choices 
                         // field in the returned activity.
});

// activity.choices should be loaded as 
// we specified the "choices" relation.
console.log(activity.choices.length === 4);
```

Which in the background results in TypeORM — the ORM we are using for Lectern — actually executing a merging SQL query like this in order to find all the choices that belong to the activity with ID of 3:

```sql
SELECT Activity.Name Activity.Kind Choice.ActivityID 
       Choice.Name Choice.NumVotes Choice.IsCorrect
FROM Activity LEFT JOIN Choice
ON Activity.ID = Choice.ActivityID
WHERE ActivityID = 3;
```

But as a TypeORM user — ***we don't need to know that!*** 

Instead, we just need to let TypeORM know the relation between activities and choices.

First, recall that in the SQL example, we related activities and choices by creating a foreign key ActivityID column within the Choice table:

```sql
CREATE TABLE Choice (
  ID         int 
  Name       varchar(255)  -- "All of the above"
  NumVotes   int           -- 25
  IsCorrect  boolean       -- false
  ActivityID int           -- The activity that this 
                           -- choice belongs to

  PRIMARY KEY (ID)
  FOREIGN KEY (ActivityID) REFERENCES Activity(ID)
);
```

We want the same thing for TypeORM, for a foreign key ActivityID within the Choice SQL table. For TypeORM, we do this by using a decorator to the `activity` field in the Choice entity like this. When TypeORM reads this code to build the Choice SQL table, it essentially does the same thing as the SQL example above, and just adds a foreign key ActivityID within the Choice table it creates:

```js
@ObjectType()
class Choice {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    isCorrect: boolean;

    @Column()
    numVotes: number;

    @ManyToOne(Activity)
    activity: Activity;
}
```

***So the `activity` field in the Choice entity is just a foreign key ActivityID in the Choice SQL table!***

And after adding the foreign key in the Choice entity, we can then add a `choices` field to the Activity entity like this. Unlike with adding the `activity` field to the Choice entity, this ***doesn't*** add any extra columns or foreign keys to the Activity SQL table. 

```js
@ObjectType()
class Activity {
    @PrimaryGeneratedColumn()
    id: number;

    @Column()
    name: string;

    @Column()
    kind: string;

    @ManyToOne(Session)
    session: Session;

    @OneToMany((type) => [Choice], (choice) => choice.activity)
    choices: Choice[];
}
```

***So the `choices` field in the Activity entity is not stored in the Activity SQL table!***

Instead, it is there to let TypeORM know that: 

1. They can use the foreign key ActivityID in the Choice table, 

    Which recall, would be given by the `activity` field in the Choice table, which is why we need to provide the function `(choice : Choice) : Activity => choice.activity`,

2. To make an array of Choice entities,

    Which is why we need to provide the function `(type) => [Choice]`.

#### Express Middleware

Testing\

#### Creating a GraphQL Schema

Testing

### Client

#### Building a Webpage using NextJS

Testing

#### Live Updates using GraphQL Subscriptions

Testing

#### Managing Open and Closed Sessions

Testing

## Running Lectern

### NodeJS Version 16 is required

Currently, building the Lectern Client requires using Node v16 — this can be done using [nvm][1]:

```bash
$ nvm install 16
Now using node v16.20.2 (npm v8.19.4)
$ node -v 
v16.20.2
```

Trying to build Lectern Client while using Node v20 will lead to an error message with code `'ERR_OSSL_EVP_UNSUPPORTED'`, relating to how [Node v17 removed support for OpenSSL v1.1.1 in favour of OpenSSL v3.0][2]. 

Updating project dependecies should fix the issue, especially [NextJS][3] and ReactJS.

[1]: https://github.com/nvm-sh/nvm
[2]: https://nodejs.org/en/blog/release/v17.0.0#openssl-30
[3]: https://github.com/vercel/next.js/issues/30078

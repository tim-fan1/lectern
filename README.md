# Lectern

Lectern is a lecture/class engagement and participation platform — like Kahoot! or Slido — written by Tim Fan, Jack Jiang, Brian Nguyen, Eddie Qi, and Ivan Velickovic.

<p align="center">
  <img src="https://github.com/user-attachments/assets/8db6c5df-0a8b-4a86-99db-50f79407b5fb" />
</p>

# Who is Lectern for?

Lectern aims to help instructors deliver engaging lessons for their students. But unlike a real lectern which presents ***to the instructor*** the information and notes that they would want to use to help with engaging students in the lesson, our Lectern web application aims to present ***to the students themselves*** opportunities to engage more with the lesson themselves and actively participate more in the lesson themselves.

<p align="center">
  <img src="https://github.com/user-attachments/assets/56d40bd1-a5ca-4994-a341-2dfe6fcf7c84" />
</p>

## Instructors

For instructors, Lectern provides the tools to create simple, intuitive, and versatile activites for students to engage in with their peers:
- Like multiple-choice quizzes, which instructors can use to measure overall understanding of the lesson so far; and also live polls, which can facilitate conversation between students where opinions or ideas seem to differ;

- Along with open-ended activities like a live QnA session that instructors can start when they are ready to take questions from students both offline and online, and also pause when they feel they should be continuing on with the lesson, which gives students time to think about their questions more too.

<p align="center">
  <img src="https://github.com/user-attachments/assets/0efbf264-89ee-4665-9634-fd183b7d72ae" />
</p>

## Students

For students, Lectern provides a way to easily join Lectern Sessions that their instructors have opened and shared with them, by either scanning a large QR code on the screen, or by entering in a short room code on the no-account required Lectern web application. When joining a live Lectern Session, students have a choice to either use their real name or other nickname, or to provide no name at all and remain anonymous.

<p align="center">
  <img src="https://github.com/user-attachments/assets/a1e10617-8ad5-49cb-aaf8-65a7efa12199" />
</p>

# Running Lectern

## NodeJS Version 16 is required

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

## Server

Testing

## Client

Testing

# How does Lectern work?

## Server

### Data Management using ORM's

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

#### Using SQL Queries

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
#### Using ORM Queries

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
//
// console.log(true);
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

First, note that in the SQL example, we related activities and choices by creating a foreign key ActivityID column within the Choice table:

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

We want the same thing for TypeORM, for a foreign key ActivityID within the Choice SQL table. For TypeORM, we do this by using a decorator — the `@ManyToOne` decorator, which we can think of as meaning that many choices belong to one activity — on the `activity` field in the Choice entity like this. When TypeORM reads this code to build the Choice SQL table, it essentially does the same thing as the SQL example above, and just adds a foreign key ActivityID within the Choice table it creates:

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

And after adding the foreign key in the Choice entity, we can then add a `choices` field to the Activity entity like this, which also requires adding a decorator — this time the corresponding `@OneToMany` decorator, which we can think of as meaning that one activity relates to many choices. But unlike with adding the `activity` field to the Choice entity, this ***doesn't*** add any extra columns or foreign keys to the Activity SQL table:

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

By using an ORM like this, we can let the ORM do the more complicated SQL queries for us (like fetching an array of the entities that relate to another entity), and only have to see the result of the query already parsed for us to use (like the array being stored for us in `const children : ChildEntity[] = parentEntity.childrenEntities`). 

### Express Middleware

Lectern is a Node Express app, instructors and students using the Lectern web app — the client — through their phone or computer will be sending HTTP requests to the Lectern Node Express app — the server — in order to insert and retrieve information from the application's database, especially the information that is sensitive and so should be made only available to the instructors and students who are authorised to see it.

For instructors, this means that if they want access to the Lectern Sessions they have created — and for them to be the only people who can access those Sessions — they would need to prove that they are who they say they are, that they are the person who created these Sessions.

Like most web apps, this means requiring all instructors to register an account with Lectern, before they are allowed to create any Lectern Sessions. Once an instructor is registered with Lectern, they can then log into their Lectern account using their registered email and password, and in turn receive a unique token that they can use to prove that they are who they say they are.

And like most web apps, this token is stored in the instructor's browser's cookies, which are sent along with every request to the server, so that the server can verify that the token sent by the instructor is the same token that the server assigned to the instructor.

#### Cookie Parser



### Creating a GraphQL Schema

Testing

## Client

### Building a Webpage using NextJS

Testing

### Live Updates using GraphQL Subscriptions

Testing

### Managing Open and Closed Sessions

Testing

# SPEC-LMS-003: Acceptance Criteria

| Field | Value         |
| ----- | ------------- |
| id    | SPEC-LMS-003  |
| phase | acceptance    |
| tags  | forum, LMS    |

---

## Acceptance Scenarios (Given/When/Then)

### REQ-LMS-029: Thread Creation

#### Scenario 1: Student Creates a Thread Successfully

```gherkin
Given an enrolled student is viewing the forum for course "Math 101"
  And the course status is PUBLISHED
When the student fills in title "Help with Chapter 3" and content "I don't understand derivatives"
  And the student clicks "Create Thread"
Then a new ForumThread record is created with the provided title, content, and courseId
  And the thread's authorId matches the student's Clerk userId
  And the thread's authorRole is "student"
  And the thread's lastActivityAt is set to the current timestamp
  And the forum thread list shows the new thread at the top (below any pinned threads)
```

#### Scenario 2: Teacher Creates a Thread

```gherkin
Given a teacher who owns course "Math 101" is viewing the forum
When the teacher creates a thread with title "Week 3 Q&A" and content "Post your questions here"
Then a new ForumThread record is created with authorRole "teacher"
  And the thread appears in the thread list
  And the teacher's name is displayed as the author
```

#### Scenario 3: Pinned Threads Appear First

```gherkin
Given a course forum has 5 threads
  And thread "Announcements" has isPinned = true with lastActivityAt 7 days ago
  And thread "Recent Question" has isPinned = false with lastActivityAt 1 minute ago
When a user views the forum thread list
Then "Announcements" appears before "Recent Question" in the list
  And within each group (pinned, unpinned), threads are sorted by lastActivityAt descending
```

---

### REQ-LMS-030: Reply to Thread

#### Scenario 4: Student Replies to a Thread

```gherkin
Given an enrolled student is viewing thread "Help with Chapter 3"
  And the thread is not locked
When the student types "Try using the power rule" and clicks "Reply"
Then a new ForumReply record is created with threadId matching the current thread
  And the ForumThread.lastActivityAt is updated to the current timestamp
  And the reply appears at the bottom of the reply list
```

#### Scenario 5: Reply Triggers Notification to Thread Author

```gherkin
Given student "Alice" authored thread "Help with Chapter 3"
  And student "Bob" is viewing the thread
When Bob submits a reply "Have you tried the textbook examples?"
Then a Notification record is created with:
  | userId  | Alice's Clerk userId |
  | type    | FORUM_REPLY          |
  | message | Contains reference to the thread title |
  And Alice sees an unread notification in her NotificationBell
```

#### Scenario 6: Thread Author Replying Does Not Self-Notify

```gherkin
Given student "Alice" authored thread "Help with Chapter 3"
When Alice submits a reply to her own thread
Then no Notification record is created for Alice
  And the reply is still created successfully
  And lastActivityAt is still updated
```

#### Scenario 7: Reply to Reply (Nested Reply)

```gherkin
Given thread "Help with Chapter 3" has a reply with id 42 by student "Bob"
When student "Carol" submits a reply with parentId = 42
Then a ForumReply is created with threadId matching the thread and parentId = 42
  And the reply is displayed as a nested response under Bob's reply
```

---

### REQ-LMS-031: Teacher Moderation

#### Scenario 8: Teacher Pins a Thread

```gherkin
Given a teacher who owns the course is viewing thread "Important Resources"
When the teacher clicks the "Pin" button
Then the ForumThread.isPinned is set to true
  And the thread moves to the top of the forum thread list
  And a pin badge icon is displayed on the thread card
```

#### Scenario 9: Teacher Locks a Thread

```gherkin
Given a teacher who owns the course is viewing thread "Old Discussion"
When the teacher clicks the "Lock" button
Then the ForumThread.isLocked is set to true
  And a lock badge icon is displayed on the thread
  And the reply form is disabled with a message "This thread is locked"
```

#### Scenario 10: Admin Deletes a Thread with Replies and Votes

```gherkin
Given an admin is viewing thread "Spam Post" which has 5 replies and 12 votes
When the admin clicks "Delete Thread" and confirms the action
Then the ForumThread record is deleted
  And all 5 ForumReply records associated with the thread are cascade-deleted
  And all 12 ForumVote records associated with those replies are cascade-deleted
  And the user is redirected to the forum thread list
  And the deleted thread no longer appears in the list
```

#### Scenario 11: Teacher Deletes a Single Reply

```gherkin
Given a teacher is viewing a thread with an inappropriate reply
When the teacher clicks "Delete" on the specific reply
Then the ForumReply record is deleted
  And any child replies and votes for that reply are cascade-deleted
  And the remaining replies are still visible
```

---

### REQ-LMS-032: Reply Upvoting

#### Scenario 12: Student Upvotes a Reply

```gherkin
Given an enrolled student is viewing a thread with a reply by "Bob"
  And the student has not voted on Bob's reply
  And Bob's reply currently shows 3 votes
When the student clicks the upvote button on Bob's reply
Then a ForumVote record is created with the student's userId and the replyId
  And the vote count display updates to 4
  And the upvote button shows an active/filled state
```

#### Scenario 13: Student Removes Their Upvote (Toggle)

```gherkin
Given an enrolled student has already upvoted a reply (vote count shows 4)
When the student clicks the upvote button again on the same reply
Then the ForumVote record for (replyId, userId) is deleted
  And the vote count display updates to 3
  And the upvote button returns to an inactive/outline state
```

---

### REQ-LMS-033: Mark Reply as Accepted

#### Scenario 14: Thread Author Marks a Reply as Accepted

```gherkin
Given student "Alice" authored thread "Help with Chapter 3"
  And the thread has replies from Bob and Carol
  And no reply is currently accepted
When Alice clicks "Accept" on Bob's reply
Then ForumReply.isAccepted is set to true on Bob's reply
  And a checkmark badge is displayed on Bob's reply
  And no other reply in the thread has isAccepted = true
```

#### Scenario 15: Accepting a New Reply Unsets the Previous Accepted Reply

```gherkin
Given Bob's reply is currently marked as accepted in thread "Help with Chapter 3"
When Alice clicks "Accept" on Carol's reply
Then Bob's reply has isAccepted set to false (checkmark removed)
  And Carol's reply has isAccepted set to true (checkmark displayed)
  And only one reply in the thread has isAccepted = true
```

---

### REQ-LMS-034: Locked Thread Behavior

#### Scenario 16: Locked Thread Blocks New Replies

```gherkin
Given thread "Old Discussion" has isLocked = true
When an enrolled student attempts to submit a reply
Then the createReply Server Action returns { success: false, error: true, message: "This thread is locked" }
  And no ForumReply record is created
  And the reply form is visually disabled with a "Thread is locked" message
```

#### Scenario 17: Locked Thread Allows Reading and Voting

```gherkin
Given thread "Old Discussion" has isLocked = true
  And the thread has 3 existing replies
When an enrolled student views the thread
Then all 3 replies are visible and readable
  And the upvote buttons on existing replies are still functional
  And the student can toggle votes on existing replies
```

---

### REQ-LMS-035: Anonymous Posting

#### Scenario 18: Student Creates an Anonymous Thread

```gherkin
Given an enrolled student is creating a new thread
When the student checks "Post anonymously" and submits the thread
Then the ForumThread is created with isAnonymous = true
  And the thread's authorId still stores the student's actual Clerk userId
  And when another student views the thread list, the author is displayed as "Anonymous"
```

#### Scenario 19: Teacher Sees Anonymous Author Identity

```gherkin
Given a thread was created anonymously by student "Alice"
When the course teacher views the forum thread list
Then the thread author is displayed as "Anonymous (Alice)" or shows Alice's name
  And the teacher can see the actual identity behind anonymous posts
```

#### Scenario 20: Admin Sees Anonymous Author Identity

```gherkin
Given a reply was created anonymously by student "Bob"
When an admin views the thread containing Bob's reply
Then the reply shows "Anonymous (Bob)" or reveals Bob's identity to the admin
  And regular students viewing the same reply see only "Anonymous"
```

---

### REQ-LMS-036: Forum Access Guards

#### Scenario 21: Non-Enrolled Student Cannot Access Forum

```gherkin
Given student "Eve" is NOT enrolled in course "Math 101"
When Eve attempts to navigate to /list/courses/{mathCourseId}/forum
Then the page returns an access denied state or redirects
  And Eve cannot see any forum threads
  And Eve cannot create threads or replies
```

#### Scenario 22: Student Cannot Pin or Lock Threads

```gherkin
Given an enrolled student is viewing a thread they authored
When the student views the thread detail page
Then no "Pin", "Lock", or "Delete" moderation controls are visible
  And if the student manually invokes pinThread via direct action call, the action returns an authorization error
```

#### Scenario 23: Student Cannot Delete Another Student's Reply

```gherkin
Given student "Alice" is viewing a reply authored by student "Bob"
When Alice views the reply
Then no "Delete" button is visible on Bob's reply
  And if Alice manually invokes deleteReply for Bob's reply, the action returns an authorization error
```

#### Scenario 24: Duplicate Vote Prevention

```gherkin
Given student "Alice" has already voted on reply #42
When Alice attempts to create another vote on reply #42 (bypassing the UI toggle)
Then the database unique constraint @@unique([replyId, userId]) prevents the duplicate insert
  And the toggleVote action handles the constraint gracefully by treating it as an unvote
```

---

## Edge Cases

### Edge Case 1: Thread with No Replies

```gherkin
Given a thread exists with zero replies
When a user views the thread detail page
Then the thread content is displayed
  And a message "No replies yet. Be the first to reply!" is shown
  And the reply form is available for interaction
```

### Edge Case 2: Deleting a Reply That Has Child Replies

```gherkin
Given reply #10 has 3 child replies (parentId = 10)
When a teacher deletes reply #10
Then reply #10 is deleted
  And all 3 child replies are cascade-deleted
  And their associated votes are cascade-deleted
```

### Edge Case 3: Accepting a Reply in a Thread With Only One Reply

```gherkin
Given a thread has exactly one reply
When the thread author clicks "Accept" on that reply
Then the reply is marked as accepted
  And the $transaction completes successfully (no previous accepted reply to unset)
```

### Edge Case 4: Creating a Thread When Not Enrolled and Not Teacher

```gherkin
Given a teacher who does NOT own course "Math 101"
  And the teacher is NOT enrolled as a student
When the teacher attempts to create a thread in "Math 101" forum
Then the createThread action returns { success: false, error: true, message: "Access denied" }
```

### Edge Case 5: Voting on a Reply in a Locked Thread

```gherkin
Given a thread is locked (isLocked = true)
  And the thread has existing replies with votes
When an enrolled student clicks upvote on a reply
Then the vote is created/toggled successfully
  And the vote count updates
  And the reply form remains disabled (voting is separate from replying)
```

### Edge Case 6: Anonymous Thread Author Receives Notification

```gherkin
Given student "Alice" created an anonymous thread
When student "Bob" replies to the thread
Then Alice receives a notification
  And the notification message does not reveal to Alice that her thread was anonymous
  And the system correctly resolves Alice's userId from the anonymous thread's authorId
```

### Edge Case 7: Forum Page for a Course with No Threads

```gherkin
Given course "Physics 201" has zero forum threads
When an enrolled student navigates to the forum
Then a message "No discussions yet. Start a conversation!" is displayed
  And the "Create Thread" button is available
```

### Edge Case 8: Pagination with Mixed Pinned and Unpinned Threads

```gherkin
Given a course forum has 3 pinned threads and 25 unpinned threads
  And ITEM_PER_PAGE is 10
When a user views page 1
Then all 3 pinned threads appear first
  And 7 unpinned threads fill the remaining slots (total 10)
When the user navigates to page 2
Then 10 unpinned threads appear (no pinned threads repeated)
```

---

## Security Test Cases

### SEC-1: Server Action Authorization Bypass Attempt

```gherkin
Given a non-enrolled student knows the courseId and constructs a direct Server Action call
When the student calls createThread with a valid courseId
Then the checkForumAccess() function returns false
  And the action returns { success: false, error: true, message: "Access denied" }
  And no database record is created
```

### SEC-2: Student Moderation Escalation Attempt

```gherkin
Given an enrolled student obtains a thread ID
When the student directly calls pinThread or lockThread via form submission
Then the action checks that the caller's role is "teacher" or "admin"
  And returns { success: false, error: true, message: "Access denied" }
  And the thread's isPinned and isLocked remain unchanged
```

### SEC-3: Cross-Course Forum Access Attempt

```gherkin
Given student "Alice" is enrolled in course 1 but NOT course 2
When Alice navigates to /list/courses/2/forum
Then the page returns access denied
  And when Alice calls createThread with courseId = 2
Then the action returns access denied
```

### SEC-4: Thread Author Identity Leak Prevention

```gherkin
Given a thread was created anonymously by student "Alice"
When another student "Bob" inspects the API response or page source
Then Alice's userId, name, or any identifying information is NOT present in the response
  And only "Anonymous" is rendered in the HTML
```

### SEC-5: Input Validation - XSS Prevention

```gherkin
Given a user submits a thread with title "<script>alert('xss')</script>"
When the title is rendered on the forum thread list
Then the HTML is escaped and the script does not execute
  And React's default JSX escaping handles this automatically
```

### SEC-6: Input Validation - Content Length Limits

```gherkin
Given a user submits a thread with content exceeding 10,000 characters
When the form is submitted
Then the Zod schema validation rejects the input on the client side
  And the server-side safeParse also rejects it
  And no database record is created
```

---

## Smoke Test Checklist

- [ ] Prisma migration applies without errors
- [ ] Existing course detail page (`/list/courses/[id]`) still renders correctly
- [ ] Existing LMS pages (modules, lessons, quizzes) are unaffected
- [ ] Forum thread list page loads for an enrolled student
- [ ] Forum thread list page loads for the course teacher
- [ ] Forum thread list page loads for an admin
- [ ] Forum thread list page blocks access for a non-enrolled student
- [ ] Thread creation works for an enrolled student
- [ ] Thread creation works for the course teacher
- [ ] Thread appears in the list sorted by lastActivityAt
- [ ] Pinned thread appears at the top of the list
- [ ] Reply creation works and updates lastActivityAt
- [ ] Reply creation sends notification to thread author
- [ ] Reply to a reply (nested) creates correctly with parentId
- [ ] Reply form is disabled on a locked thread
- [ ] Upvote button creates a ForumVote record
- [ ] Upvote button removes a ForumVote record on second click (toggle)
- [ ] Vote count updates correctly after toggle
- [ ] Mark reply as accepted sets isAccepted = true
- [ ] Marking a new reply as accepted unsets the previous one
- [ ] Teacher can pin a thread
- [ ] Teacher can lock a thread
- [ ] Teacher can delete a thread (cascade deletes replies and votes)
- [ ] Teacher can delete a single reply
- [ ] Admin can perform all moderation actions
- [ ] Anonymous thread shows "Anonymous" to students
- [ ] Anonymous thread shows actual author to teachers
- [ ] Anonymous thread shows actual author to admins
- [ ] Pagination works on the thread list page
- [ ] Forum link is accessible from the course detail page
- [ ] Non-enrolled student receives access denied
- [ ] Student cannot see moderation controls (pin, lock, delete)
- [ ] No TypeScript compilation errors
- [ ] No ESLint errors

---

## Definition of Done

1. All 3 Prisma models (`ForumThread`, `ForumReply`, `ForumVote`) are migrated and operational
2. `FORUM_REPLY` added to `NotificationType` enum
3. All 10 Server Actions implemented with Zod validation and authorization checks
4. Both forum routes (`/forum` and `/forum/[threadId]`) render correctly
5. All 8 components implemented and styled with Tailwind CSS v4
6. Anonymous posting rules enforced correctly per role
7. Locked thread behavior prevents replies but allows voting and reading
8. Moderation actions (pin, lock, delete) work for teachers and admins
9. Vote toggle works with optimistic UI updates
10. Reply notifications delivered via existing notification system
11. All smoke test checklist items pass
12. No TypeScript errors, no ESLint errors
13. Existing LMS functionality is unaffected (regression-free)

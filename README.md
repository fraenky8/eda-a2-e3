### Event-Driven Architectures - Assignment 2
> Tutorial in Winter Semester 2015/16 at University Rostock, Fakultät für Informatik und Elektrotechnik, Institut für Informatik, Lehrstuhl  Architektur von Anwendungssystemen (AVA)

Date:  November 2015 

#### Exercise 3 - Message Broker

Implement a Message Broker offering a publish/subscribe interface to its clients!

  1. Choose a data and filter model that is expressive enough to allow clients to select notifications by their type, topic, or content!
  2. Choose a suitable technology for serialization/marshalling! Document how notifications and subscriptions are serialized/marshalled to network messages and vice versa!
  3. Think about how a client can cancel the subscriptions it has once made!
  4. Implement the Message Broker using the programming language(s) and framework(s) of your choice!
  5. Implement a distributed stock quote dissemination application consisting of multiple publishers and subscribers to test your message broker and demonstrate its features! Please ensure that subscribers exploit the expressiveness granted by your data and filter model!

#### TODO
  * migrate to ES6
  * migrate to new socket.io version
import { Injectable } from '@angular/core';
import { Apollo, QueryRef } from 'apollo-angular';
import { Observable, Subscription } from 'rxjs';
import { map } from 'rxjs/operators';

import { User } from '../models/user.model';
import {
  ALL_USERS_QUERY,
  GET_USER_BY_ID_QUERY,
  USERS_SUBSCRIPTION,
  UPDATE_USER_MUTATION,
  AllUsersQuery,
  UserQuery
} from './user.graphql';

@Injectable({
  providedIn: 'root'
})
export class UserService {

  users$: Observable<User[]>;
  private queryRef: QueryRef<AllUsersQuery>;
  private usersSubscription: Subscription;

  constructor(
    private apollo: Apollo
  ) { }

  startUsersMonitoring(idToExclude: string): void {
    if (!this.users$) {
      this.users$ = this.allUsers(idToExclude);
      this.usersSubscription = this.users$.subscribe();
    }
  }

  stopUsersMonitoring(): void {
    if (this.usersSubscription) {
      this.usersSubscription.unsubscribe();
      this.usersSubscription = null;
      this.users$ = null;
    }
  }

  allUsers(idToExclude: string): Observable<User[]> {
    this.queryRef = this.apollo
      .watchQuery<AllUsersQuery>({
        query: ALL_USERS_QUERY,
        variables: {
          idToExclude
        },
        fetchPolicy: 'network-only'
      });

    this.queryRef.subscribeToMore({
      document: USERS_SUBSCRIPTION,
      updateQuery: (previous: AllUsersQuery, { subscriptionData }): AllUsersQuery => {

        const subscriptionUser: User = subscriptionData.data.User.node;
        const newAllUsers: User[] = [ ...previous.allUsers ];

        switch (subscriptionData.data.User.mutation) {
          case 'CREATED':
            newAllUsers.unshift(subscriptionUser);
            break;
          case 'UPDATED':
            const userToUpdateIndex: number = newAllUsers.findIndex(u => u.id === subscriptionUser.id);
            if (userToUpdateIndex > -1) {
              newAllUsers[userToUpdateIndex] = subscriptionUser;
            }
        }

        return {
          ...previous,
          allUsers: newAllUsers.sort((uA, uB) => {
            if (uA.name < uB.name) { return -1; }
            if (uA.name > uB.name) { return 1; }
            return 0;
          })
        };
      }
    });

    return this.queryRef.valueChanges
      .pipe(
        map(res => res.data.allUsers)
      );
  }

  getUserById(id: string): Observable<User> {
    return this.apollo
      .query<UserQuery>({
        query: GET_USER_BY_ID_QUERY,
        variables: { userId: id }
      }).pipe(
        map(res => res.data.User)
      );
  }

  updateUser(user: User): Observable<User> {
    return this.apollo.mutate({
      mutation: UPDATE_USER_MUTATION,
      variables: {
        id: user.id,
        name: user.name,
        email: user.email
      }
    }).pipe(
      map(res => res.data.updateUser)
    );
  }

}

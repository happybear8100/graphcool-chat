import { NgModule } from '@angular/core';

import { ChatRoutingModule } from './chat-routing.module';
import { SharedModule } from '../shared/shared.module';
import { ChatTabComponent } from './components/chat-tab/chat-tab.component';
import { ChatUsersComponent } from './components/chat-users/chat-users.component';

@NgModule({
  imports: [
    SharedModule,
    ChatRoutingModule
  ],
  declarations: [ChatTabComponent, ChatUsersComponent]
})
export class ChatModule { }

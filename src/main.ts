import { bootstrapApplication } from '@angular/platform-browser';
import { addIcons } from 'ionicons';
import {
   checkmarkCircleOutline,
  settingsOutline,
  gridOutline,
  cardOutline,
  peopleCircleOutline,
  personAddOutline,
  peopleOutline
} from 'ionicons/icons';
import { routes } from './app/app.routes';
import { AppComponent } from './app/app.component';
import { appConfig } from './app/core/config/app.config';

addIcons({
  'checkmark-circle-outline': checkmarkCircleOutline,
  'settings-outline': settingsOutline,
  'grid-outline': gridOutline,
  'card-outline': cardOutline,
  'people-circle-outline': peopleCircleOutline,
  'person-add-outline': personAddOutline,
  'people-outline': peopleOutline,
});
bootstrapApplication(AppComponent, appConfig);

//
//  FitnessWidgetBundle.swift
//  FitnessWidget
//
//  Created by Tanner Davidson on 6/10/26.
//

import WidgetKit
import SwiftUI

@main
struct FitnessWidgetBundle: WidgetBundle {
    var body: some Widget {
        NutritionWidget()
        ActivityWidget()
        WorkoutLiveActivity()
    }
}

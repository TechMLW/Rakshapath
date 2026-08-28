from fastapi import APIRouter, Depends, HTTPException
from sqlalchemy.orm import Session

from database import get_db
from models import Notification
from notification_schemas import NotificationCreate


router = APIRouter(
    prefix="/notifications",
    tags=["Notifications"]
)


# ==========================================
# CREATE NOTIFICATION
# ==========================================

@router.post("/")
def create_notification(
    notification: NotificationCreate,
    db: Session = Depends(get_db)
):

    try:

        print("Received notification:", notification)

        new_notification = Notification(
    user_id=notification.user_id,
    title=notification.title,
    message=notification.message,
    notification_type=notification.notification_type,
    is_read=False
)

        print("Notification object created")

        db.add(new_notification)

        print("Notification added to database session")

        db.commit()

        print("Database commit successful")

        db.refresh(new_notification)

        print("Database refresh successful")

        return {
            "message": "Notification created successfully",
            "notification_id": new_notification.id
        }

    except Exception as e:

        print("NOTIFICATION ERROR:", repr(e))

        db.rollback()

        raise HTTPException(
            status_code=500,
            detail=f"Notification error: {str(e)}"
        )


# ==========================================
# GET NOTIFICATIONS
# ==========================================

@router.get("/{user_id}")
def get_notifications(
    user_id: int,
    db: Session = Depends(get_db)
):

    try:

        notifications = db.query(Notification).filter(
            Notification.user_id == user_id
        ).order_by(
            Notification.id.desc()
        ).all()

        return [
            {
                "id": notification.id,
                "message": notification.message,
                "notification_type": notification.notification_type,
                "is_read": notification.is_read
            }
            for notification in notifications
        ]

    except Exception as e:

        print("GET NOTIFICATION ERROR:", repr(e))

        raise HTTPException(
            status_code=500,
            detail=str(e)
        )